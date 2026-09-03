import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { File } from 'expo-file-system';
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from 'expo-audio';
import { useTranscribeAudio } from './useTranscricao';
import { describeTranscriptionError } from '../utils/errorMessages';
import type { IdiomaTranscricao } from '../services/transcricaoService';

export type VoiceRecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error';

/**
 * The only module that touches `expo-audio`/`expo-file-system` directly.
 * `ClinicalNarrativeEditor` only ever sees `status`, `durationSeconds`,
 * `errorMessage`, and a plain `onTranscribed(text)` callback — it has no
 * idea a recording, an upload, or a temp file is involved. This hook never
 * touches `consultaService`/`useConsultaWorkflow` and never persists
 * anything — it produces text and nothing else.
 *
 * Recording uses `RecordingPresets.HIGH_QUALITY`, which produces a `.m4a`
 * (AAC) file on both Android and iOS — exactly the format
 * `TranscricaoController`/`SupportedAudioFormat` expects, no conversion or
 * custom recording options needed. `expo-audio` recording is included in
 * Expo Go (confirmed via the official docs) — unlike the native
 * speech-recognition approach this replaces, no development build is
 * required for this feature.
 */
export function useClinicalVoiceRecording(onTranscribed: (text: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const transcribeMutation = useTranscribeAudio();

  const [status, setStatus] = useState<VoiceRecordingStatus>('idle');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permanentlyDenied, setPermanentlyDenied] = useState(false);
  const [canRetry, setCanRetry] = useState(false);

  const pendingUriRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onTranscribedRef = useRef(onTranscribed);
  onTranscribedRef.current = onTranscribed;

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupFile = useCallback(async (uri: string | null) => {
    if (!uri) return;
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch {
      /* best-effort — a leftover temp file in the app cache dir is not a correctness problem */
    }
  }, []);

  const runTranscription = useCallback(
    async (uri: string, idioma: IdiomaTranscricao) => {
      setStatus('transcribing');
      setErrorMessage(null);

      try {
        const result = await transcribeMutation.mutateAsync({ uri, idioma });
        await cleanupFile(uri);
        pendingUriRef.current = null;
        setCanRetry(false);
        setDurationSeconds(0);
        setStatus('idle');
        if (result.transcricao.trim()) {
          onTranscribedRef.current(result.transcricao.trim());
        }
      } catch (err) {
        // Keep the file — the veterinarian may want to retry the exact same
        // recording rather than dictate again from scratch.
        pendingUriRef.current = uri;
        setCanRetry(true);
        setErrorMessage(describeTranscriptionError(err));
        setStatus('error');
      }
    },
    [transcribeMutation, cleanupFile]
  );

  const start = useCallback(async () => {
    if (status === 'recording' || status === 'transcribing') return; // one session at a time

    // Starting a fresh recording abandons any not-yet-retried previous one.
    if (pendingUriRef.current) {
      await cleanupFile(pendingUriRef.current);
      pendingUriRef.current = null;
      setCanRetry(false);
    }

    setErrorMessage(null);
    setPermanentlyDenied(false);

    try {
      const existing = await getRecordingPermissionsAsync();
      const permission = existing.granted ? existing : await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setErrorMessage('Permita o acesso ao microfone para gravar a narrativa por voz.');
        setPermanentlyDenied(!permission.canAskAgain);
        setStatus('error');
        return;
      }

      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();

      setDurationSeconds(0);
      stopTimer();
      timerRef.current = setInterval(() => setDurationSeconds((seconds) => seconds + 1), 1000);
      setStatus('recording');
    } catch {
      setErrorMessage('Não foi possível iniciar a gravação.');
      setStatus('error');
    }
  }, [status, recorder, cleanupFile]);

  const stopAndTranscribe = useCallback(
    async (idioma: IdiomaTranscricao) => {
      if (status !== 'recording') return;
      stopTimer();

      try {
        await recorder.stop();
      } catch {
        setErrorMessage('Não foi possível finalizar a gravação.');
        setStatus('error');
        return;
      }

      const uri = recorder.uri;
      if (!uri) {
        setErrorMessage('Não foi possível obter o áudio gravado.');
        setStatus('error');
        return;
      }

      await runTranscription(uri, idioma);
    },
    [status, recorder, runTranscription]
  );

  const retry = useCallback(
    (idioma: IdiomaTranscricao) => {
      if (!pendingUriRef.current) return;
      runTranscription(pendingUriRef.current, idioma);
    },
    [runTranscription]
  );

  /** Ends recording without transcribing — discards the audio. */
  const cancelRecording = useCallback(() => {
    stopTimer();
    try {
      recorder.stop();
    } catch {
      /* nothing was recording */
    }
    setStatus('idle');
    setDurationSeconds(0);
  }, [recorder]);

  const discard = useCallback(() => {
    cleanupFile(pendingUriRef.current);
    pendingUriRef.current = null;
    setCanRetry(false);
    setErrorMessage(null);
    setStatus('idle');
  }, [cleanupFile]);

  // Cleanup on unmount: stop any active recording, delete any temp file.
  useEffect(() => {
    return () => {
      stopTimer();
      try {
        recorder.stop();
      } catch {
        /* wasn't recording */
      }
      cleanupFile(pendingUriRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conservative background behavior: don't let the microphone keep
  // recording once ArkIve isn't the foreground app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && status === 'recording') {
        cancelRecording();
      }
    });
    return () => subscription.remove();
  }, [status, cancelRecording]);

  return {
    status,
    durationSeconds,
    errorMessage,
    permanentlyDenied,
    canRetry,
    start,
    stopAndTranscribe,
    retry,
    discard,
    cancelRecording,
  };
}
