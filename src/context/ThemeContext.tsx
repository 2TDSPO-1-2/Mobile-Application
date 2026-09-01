import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ThemeMode, ThemePreferences } from '../types';
import {
  getThemePreferences,
  saveThemePreferences,
  setThemeMode as persistThemeMode,
} from '../services/themeService';

interface ThemeContextValue {
  mode: ThemeMode;
  preferences: ThemePreferences;
  loading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  updatePreferences: (partial: Partial<ThemePreferences>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ThemePreferences>({
    mode: 'light',
    pushEnabled: true,
    emailEnabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getThemePreferences().then((prefs) => {
      setPreferences(prefs);
      setLoading(false);
    });
  }, []);

  const setMode = useCallback(async (mode: ThemeMode) => {
    const updated = await persistThemeMode(mode);
    setPreferences(updated);
  }, []);

  const updatePreferences = useCallback(
    async (partial: Partial<ThemePreferences>) => {
      const updated = { ...preferences, ...partial };
      await saveThemePreferences(updated);
      setPreferences(updated);
    },
    [preferences]
  );

  const value = useMemo(
    () => ({
      mode: preferences.mode,
      preferences,
      loading,
      setMode,
      updatePreferences,
    }),
    [preferences, loading, setMode, updatePreferences]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
