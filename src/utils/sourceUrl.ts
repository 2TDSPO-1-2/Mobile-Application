/**
 * Deliberately NOT using the global `URL` class — its availability isn't
 * guaranteed across every RN/Hermes runtime this app targets (no
 * `react-native-url-polyfill` installed), and a hand-rolled check gives full
 * control over exactly which schemes are ever treated as clickable.
 *
 * Only `http://`/`https://` (case-insensitive) count as a valid source URL —
 * this is the one thing standing between an arbitrary persisted string (from
 * the clinical engine, ultimately AI-generated) and `Linking.openURL`, so it
 * must never be loosened to accept other schemes (`javascript:`, `data:`,
 * `tel:`, `file:`, ...).
 */
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export interface ParsedSourceUrl {
  /** The exact original string — passed to `Linking.openURL` untouched. */
  url: string;
  /** Host portion only (keeps a `www.` prefix, e.g. "www.merckvetmanual.com") — the readable label shown instead of the full URL. */
  hostname: string;
}

/** Returns null for anything that isn't a well-formed http(s) URL — callers must render those as plain, non-pressable text. */
export function parseSourceUrl(value: string): ParsedSourceUrl | null {
  const trimmed = value.trim();
  if (!HTTP_URL_PATTERN.test(trimmed)) return null;

  const withoutScheme = trimmed.replace(/^https?:\/\//i, '');
  const hostname = withoutScheme.split(/[/?#]/)[0];
  if (!hostname) return null;

  return { url: trimmed, hostname };
}
