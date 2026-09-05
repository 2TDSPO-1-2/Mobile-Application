import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as store from './store';
import type { Language, TranslationKey } from './store';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Mounted once at the app root (see App.tsx), alongside `ThemeProvider` —
 * same shape: renders immediately with the in-memory default ('pt-BR') so
 * first paint is deterministic, then updates the moment the persisted
 * preference loads. Subscribes to `store.ts`'s module-level language so a
 * change made anywhere (e.g. a non-component call to `store.setLanguage`)
 * still re-renders every consumer.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(store.getLanguage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    store.initLanguage().then(() => {
      if (mounted) setLoading(false);
    });
    const unsubscribe = store.subscribe(() => setLanguageState(store.getLanguage()));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setLanguage = useCallback((next: Language) => store.setLanguage(next), []);

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t: store.t, loading }),
    [language, setLanguage, loading]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n deve ser usado dentro de I18nProvider');
  return ctx;
}
