import { getLanguage } from '../i18n/store';

/**
 * Pure string conversion between the app's display format and the ISO
 * YYYY-MM-DD a Java `LocalDate` expects. Deliberately never constructs a
 * `Date` object — that's how a date-only value picks up an accidental
 * timezone shift. Lexically comparable too (YYYY-MM-DD sorts correctly as a
 * plain string), which is all prescription date-range validation needs.
 *
 * The backend contract (`toIsoDate`'s output, and every `dataInicio`/
 * `dataFim` sent in a request body) is unaffected by language — only
 * `toDisplayDate`'s rendered string changes, matching the app's language
 * (DD/MM/YYYY for pt-BR, MM/DD/YYYY for en-US).
 */
export function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

export function toDisplayDate(value?: string | null): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const [, y, m, d] = match;
  return getLanguage() === 'en-US' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`;
}
