import { File } from 'expo-file-system';
import { apiPost, ApiError, NetworkError } from './apiClient';

/** Confirmed: `IdiomaTranscricao.java` — the only two values the backend accepts (defaults to pt-BR server-side, but this app always sends one explicitly). */
export type IdiomaTranscricao = 'pt-BR' | 'en-US';

/** Confirmed: `TranscricaoResponse.java`. */
export interface TranscricaoResponse {
  transcricao: string;
  idioma: IdiomaTranscricao;
}

/**
 * Thrown before any network call when the local recording itself is missing
 * or empty — lets callers (and `describeTranscriptionError`) distinguish
 * "there was never a usable file" from an actual upload/network failure.
 */
export class RecordingFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordingFileError';
  }
}

/**
 * Confirmed against `TranscricaoController.java`: `POST /api/transcricoes`,
 * `multipart/form-data`, a `MultipartFile` part named exactly `audio`, and a
 * plain form field `idioma`. The backend is stateless here — no narrative
 * is persisted, no clinical support is requested, no diagnosis is touched;
 * `TranscricaoService.transcrever` only ever returns text.
 *
 * `name`/`type` are read from the actual recorded file via the SDK 57
 * `File` API rather than guessed, so the multipart part always describes
 * the real bytes on disk instead of a hardcoded assumption. Azure
 * credentials and audio conversion live entirely server-side; this app
 * knows only this one endpoint.
 */
export async function transcribeAudio(
  audioUri: string,
  idioma: IdiomaTranscricao
): Promise<TranscricaoResponse> {
  const file = new File(audioUri);

  // TEMPORARY diagnostic — sanitized (no URI, no audio/transcript content).
  // Remove once the physical-device upload failure is confirmed fixed.
  if (__DEV__) {
    console.log(
      `[voice] file exists=${file.exists} size=${file.exists ? file.size : 0} ` +
        `extension=${file.extension} type=${file.type}`
    );
  }

  if (!file.exists || file.size === 0) {
    throw new RecordingFileError('A gravação não foi encontrada ou está vazia.');
  }

  // Append the real, Blob-compatible `File` — not React Native's classic
  // `{uri, name, type}` pseudo-object. `expo/fetch`'s FormData encoder
  // (used by apiClient) does not understand that RN-only convention at all;
  // it expects an actual Blob/File value. See the note in apiClient.ts.
  const formData = new FormData();
  formData.append('audio', file, file.name);
  formData.append('idioma', idioma);

  if (__DEV__) {
    console.log(`[voice] upload start format=${file.extension} bytes=${file.size} mime=${file.type}`);
  }

  try {
    const result = await apiPost<TranscricaoResponse>('/api/transcricoes', formData);
    if (__DEV__) console.log('[voice] upload response status=200');
    return result;
  } catch (err) {
    if (__DEV__) {
      if (err instanceof ApiError) {
        console.log(`[voice] upload response status=${err.status}`);
      } else if (err instanceof NetworkError) {
        console.log('[voice] upload fetch failed NetworkError (fetch rejected before any HTTP response)');
      } else if (err instanceof Error) {
        console.log(`[voice] upload fetch failed ${err.name}`);
      }
    }
    throw err;
  }
}
