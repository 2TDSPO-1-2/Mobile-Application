import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { pt, type Dictionary } from './pt-BR';
import { en } from './en-US';

/**
 * Same two values, same storage key, as the voice-dictation locale
 * (`IdiomaTranscricao` in transcricaoService.ts) — this is deliberately ONE
 * setting, not two: changing the app language also changes the transcription
 * locale sent to the backend, and vice versa. Re-exported under this name so
 * i18n call sites don't need to import a "transcription" type for a UI
 * language concern.
 */
export type Language = 'pt-BR' | 'en-US';

const dictionaries: Record<Language, Dictionary> = { 'pt-BR': pt, 'en-US': en };

/** `domain.key` — the only shape `pt-BR.ts` uses, enforced there structurally. */
export type TranslationKey = {
  [D in keyof Dictionary]: `${D & string}.${keyof Dictionary[D] & string}`;
}[keyof Dictionary];

// Module-level (not React state) so plain utility functions called outside
// components — error-message mappers, date formatters, status-label
// lookups — can translate too, without needing a hook or prop-drilled `t`.
// `I18nProvider` is the only writer; it mirrors this into React state for
// components to subscribe to and re-render on change.
let currentLanguage: Language = 'pt-BR';
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

/** Re-renders every subscribed component (via I18nContext) without requiring this call site to know about React. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reads the persisted preference once at startup — call exactly once, from `I18nProvider`. */
export async function initLanguage(): Promise<Language> {
  currentLanguage = await getJson<Language>(STORAGE_KEYS.voiceLocale, 'pt-BR');
  listeners.forEach((listener) => listener());
  return currentLanguage;
}

export async function setLanguage(language: Language): Promise<void> {
  if (language === currentLanguage) return;
  currentLanguage = language;
  listeners.forEach((listener) => listener());
  await setJson(STORAGE_KEYS.voiceLocale, language);
}

function resolve(key: TranslationKey, language: Language): string {
  const [domain, leaf] = key.split('.') as [keyof Dictionary, string];
  const dict = dictionaries[language];
  const value = (dict[domain] as Record<string, string> | undefined)?.[leaf];
  return value ?? key;
}

/**
 * Translates `key` in the CURRENT language at call time. Safe to call from
 * anywhere (component or plain function) — components that need to
 * re-render when the language changes should read it via `useTranslation()`
 * instead, which subscribes to this store.
 */
export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
  let text = resolve(key, currentLanguage);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    }
  }
  return text;
}
