import { getLanguage } from '../i18n/store';

/**
 * Display-only formatting driven by the current app language — never used
 * for anything sent back to the backend (which always gets an explicit
 * ISO/`LocalDateTime` string built separately, untouched by this file).
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(getLanguage());
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(getLanguage(), { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString(getLanguage(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
