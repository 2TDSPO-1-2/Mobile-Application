/**
 * Minimal, dependency-free UTF-8-safe Base64 encoder.
 *
 * React Native (Hermes) has no reliable global `btoa`, and the web build's
 * native `btoa` mangles non-Latin1 characters. This implementation behaves
 * identically on iOS, Android, and web, which matters because it backs the
 * `Authorization: Basic ...` header (see src/services/apiClient.ts).
 */

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function utf8Bytes(input: string): number[] {
  const bytes: number[] = [];

  for (let i = 0; i < input.length; i += 1) {
    let codePoint = input.codePointAt(i) as number;

    if (codePoint > 0xffff) {
      // Surrogate pair: codePointAt already combined both halves, skip the low surrogate.
      i += 1;
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f)
      );
    }
  }

  return bytes;
}

export function encodeBase64(input: string): string {
  const bytes = utf8Bytes(input);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    const triple = (b1 << 16) | ((b2 ?? 0) << 8) | (b3 ?? 0);

    result += BASE64_ALPHABET[(triple >> 18) & 0x3f];
    result += BASE64_ALPHABET[(triple >> 12) & 0x3f];
    result += b2 !== undefined ? BASE64_ALPHABET[(triple >> 6) & 0x3f] : '=';
    result += b3 !== undefined ? BASE64_ALPHABET[triple & 0x3f] : '=';
  }

  return result;
}
