import { useMutation } from '@tanstack/react-query';
import { transcribeAudio, type IdiomaTranscricao } from '../services/transcricaoService';

/**
 * Deliberately not a cached query resource — a transcription is a one-shot
 * action tied to one specific recording, not data worth keeping around or
 * refetching. `retry: false`: an automatic retry here would mean silently
 * firing a second real (billed) Azure transcription call after an uncertain
 * network failure. If the upload's outcome is uncertain, the veterinarian
 * decides explicitly via the "Tentar transcrever novamente" affordance in
 * useClinicalVoiceRecording — never an automatic repeat.
 */
export function useTranscribeAudio() {
  return useMutation({
    mutationFn: ({ uri, idioma }: { uri: string; idioma: IdiomaTranscricao }) =>
      transcribeAudio(uri, idioma),
    retry: false,
  });
}
