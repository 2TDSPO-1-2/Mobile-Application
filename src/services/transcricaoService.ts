import { Platform } from 'react-native';
import { File as ExpoFile } from 'expo-file-system';
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
 * Also thrown on web when the recorded `blob:` URL can't be resolved back
 * into bytes — that's still a local-recording problem, never a network one.
 */
export class RecordingFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordingFileError';
  }
}

interface ResolvedAudio {
  /** Blob-compatible value FormData can append directly — `expo-file-system`'s `File` on native (it implements `Blob`), the browser's own `File` on web. */
  blobPart: Blob;
  filename: string;
  byteLength: number;
  mimeType: string;
}

/** Native (iOS/Android) — the existing, proven `expo-file-system` path, unchanged. */
function resolveNativeRecording(audioUri: string): ResolvedAudio {
  const file = new ExpoFile(audioUri);

  if (!file.exists || file.size === 0) {
    throw new RecordingFileError('A gravação não foi encontrada ou está vazia.');
  }

  return { blobPart: file, filename: file.name, byteLength: file.size, mimeType: file.type };
}

/**
 * Confirmed against the real backend contract (`SupportedAudioFormat.java`):
 * only WAV, M4A (extensions `m4a`/`mp4`; content-types `audio/mp4`,
 * `audio/m4a`, `audio/x-m4a`, `video/mp4`), and AAC are accepted. Never
 * invents/lies about a format the backend doesn't have — anything outside
 * this list (e.g. `audio/webm`, which desktop Chrome's `MediaRecorder`
 * produces) is named truthfully by its own subtype and left to fail with the
 * backend's own honest "unsupported format" response, rather than being
 * mislabeled as one of the supported ones just to slip past validation.
 */
function extensionForMimeType(mimeType: string): string {
  const normalized = mimeType.split(';')[0].trim().toLowerCase();
  if (normalized === 'audio/wav' || normalized === 'audio/x-wav' || normalized === 'audio/wave' || normalized === 'audio/vnd.wave') {
    return 'wav';
  }
  if (normalized === 'audio/mp4' || normalized === 'audio/m4a' || normalized === 'audio/x-m4a' || normalized === 'video/mp4') {
    return 'm4a';
  }
  if (normalized === 'audio/aac' || normalized === 'audio/aacp' || normalized === 'audio/x-aac') {
    return 'aac';
  }
  const subtype = normalized.split('/')[1];
  return subtype || 'bin';
}

/**
 * Web (`expo-audio`'s web implementation is backed by the browser's own
 * `MediaRecorder`): confirmed in `expo-audio`'s source that `recorder.uri`
 * there is a `blob:` object URL (`URL.createObjectURL(recordedBlob)`) — not
 * a real filesystem path. `expo-file-system`'s `File` is built around its
 * own native/virtual filesystem and does not understand an arbitrary
 * `blob:` URL created by an unrelated Web API (this was the actual root
 * cause of the web upload failure — see the module-level note below).
 *
 * `fetch()` on a `blob:` URL is the standard, purely local (no network
 * request involved — it never leaves the browser) way to read those bytes
 * back as a real `Blob`. Deliberately the ambient global `fetch`, not
 * `expo/fetch` (used elsewhere for the actual authenticated API calls) —
 * this step never talks to our API, it only resolves a same-origin blob URL
 * the browser itself created.
 */
async function resolveWebRecording(audioUri: string): Promise<ResolvedAudio> {
  let response: Response;
  try {
    response = await fetch(audioUri);
  } catch {
    throw new RecordingFileError('A gravação não foi encontrada. Grave novamente.');
  }

  if (!response.ok) {
    throw new RecordingFileError('A gravação não foi encontrada. Grave novamente.');
  }

  const blob = await response.blob();
  if (!blob.size) {
    throw new RecordingFileError('A gravação não foi encontrada ou está vazia.');
  }

  // Preserve the REAL mime type the browser recorded with — never guessed,
  // never overridden — and derive a filename extension consistent with it.
  const mimeType = blob.type || 'application/octet-stream';
  const filename = `recording.${extensionForMimeType(mimeType)}`;

  return { blobPart: blob, filename, byteLength: blob.size, mimeType };
}

/**
 * Confirmed against `TranscricaoController.java`: `POST /api/transcricoes`,
 * `multipart/form-data`, a `MultipartFile` part named exactly `audio`, and a
 * plain form field `idioma`. The backend is stateless here — no narrative
 * is persisted, no clinical support is requested, no diagnosis is touched;
 * `TranscricaoService.transcrever` only ever returns text.
 *
 * The ONLY thing that differs by platform is how the local recording gets
 * turned into a Blob-compatible value for `FormData` (see
 * `resolveNativeRecording`/`resolveWebRecording` above) — everything after
 * that (FormData construction, the authenticated `apiPost` call, error
 * mapping) is identical on every platform, and CORS is already configured
 * identically for this path (same `/api/**` rule as every other endpoint —
 * confirmed in `SecurityConfig.java`), so a genuine network/CORS rejection
 * here still surfaces as the normal `NetworkError`/`ApiError` path below,
 * unchanged.
 */
export async function transcribeAudio(
  audioUri: string,
  idioma: IdiomaTranscricao
): Promise<TranscricaoResponse> {
  const resolved =
    Platform.OS === 'web' ? await resolveWebRecording(audioUri) : resolveNativeRecording(audioUri);

  // TEMPORARY diagnostic — sanitized (Platform.OS, URI scheme only, byte
  // count, MIME, HTTP status; never credentials, full URI, transcript, or
  // audio contents). Remove once the web upload fix is confirmed working.
  if (__DEV__) {
    console.log(
      `[voice] resolved platform=${Platform.OS} uriScheme=${audioUri.split(':')[0]} ` +
        `bytes=${resolved.byteLength} mime=${resolved.mimeType} filename=${resolved.filename}`
    );
  }

  const formData = new FormData();
  formData.append('audio', resolved.blobPart, resolved.filename);
  formData.append('idioma', idioma);

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
