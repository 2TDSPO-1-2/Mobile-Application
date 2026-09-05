import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { downloadConsultaResumoPdf, buildConsultaPdfFilename } from '../services/consultaPdfService';
import { describeConsultaPdfError } from '../utils/errorMessages';

/**
 * Writes the PDF into the app's cache directory (not document directory —
 * this is a throwaway export artifact, not app data worth keeping) using the
 * current SDK 57 `File`/`Paths` API (the same one `useClinicalVoiceRecording`
 * already uses for the recorded audio file — no legacy
 * `FileSystem.writeAsStringAsync`/base64 path here).
 */
function writeToCacheFile(bytes: Uint8Array<ArrayBuffer>, filename: string): File {
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create({ overwrite: true });
  file.write(bytes);
  return file;
}

/** Best-effort — a leftover temp PDF in the cache dir is not a correctness problem; the OS can reclaim it. */
function cleanupFile(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    /* best-effort */
  }
}

async function shareOnNative(bytes: Uint8Array<ArrayBuffer>, filename: string): Promise<void> {
  const file = writeToCacheFile(bytes, filename);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    cleanupFile(file);
    throw new Error('Sharing is not available on this device.');
  }

  try {
    // Never delete before this resolves — the share sheet reads the file
    // from disk while it's open (and possibly for as long as the user takes
    // to pick a target app), so deleting earlier would corrupt the share.
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
  } finally {
    cleanupFile(file);
  }
}

function shareOnWeb(bytes: Uint8Array<ArrayBuffer>, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Owns the whole "share/download the owner-facing PDF" action end to end:
 * authenticated fetch -> platform-appropriate hand-off (native share sheet /
 * web browser download). Nothing here ever persists the bytes beyond that —
 * matching the backend's own `Cache-Control: no-store` on this endpoint.
 */
export function useConsultaResumoPdf(consultaId: number, animalNome?: string | null) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Guards against a double-tap starting a second fetch/share while the
  // first is still in flight — `isPending` alone can lag one render behind
  // a rapid second tap, this ref cannot.
  const inFlightRef = useRef(false);

  const share = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsPending(true);
    setErrorMessage(null);

    try {
      const { bytes } = await downloadConsultaResumoPdf(consultaId);
      const filename = buildConsultaPdfFilename(consultaId, animalNome);

      if (Platform.OS === 'web') {
        shareOnWeb(bytes, filename);
      } else {
        await shareOnNative(bytes, filename);
      }
    } catch (err) {
      setErrorMessage(describeConsultaPdfError(err));
    } finally {
      inFlightRef.current = false;
      setIsPending(false);
    }
  }, [consultaId, animalNome]);

  return { share, isPending, errorMessage };
}
