import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import type { IdiomaTranscricao } from '../services/transcricaoService';
import { spacing, fontSize, radius } from '../styles/theme';

const LOCALE_OPTIONS: { value: IdiomaTranscricao; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
];

export function SettingsScreen() {
  const { mode, preferences, setMode, updatePreferences } = useTheme();
  const colors = useThemeColors();
  const rowStyle = [styles.row, { borderBottomColor: colors.border }];

  // This is a veterinarian preference, not consultation data — the exact
  // same STORAGE_KEYS.voiceLocale the recording flow already reads, just no
  // longer surfaced inside the consultation itself.
  const [voiceLocale, setVoiceLocale] = useState<IdiomaTranscricao>('pt-BR');

  useEffect(() => {
    getJson<IdiomaTranscricao>(STORAGE_KEYS.voiceLocale, 'pt-BR').then(setVoiceLocale);
  }, []);

  const handleVoiceLocaleChange = (next: IdiomaTranscricao) => {
    setVoiceLocale(next);
    setJson(STORAGE_KEYS.voiceLocale, next);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Configurações" />

      <ScreenContainer>
        <Text style={[styles.section, { color: colors.text }]}>Aparência</Text>
        <View style={rowStyle}>
          <Text style={{ color: colors.text }}>Tema escuro</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={(value) => setMode(value ? 'dark' : 'light')}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Notificações</Text>
        <View style={rowStyle}>
          <Text style={{ color: colors.text }}>Push</Text>
          <Switch
            value={preferences.pushEnabled}
            onValueChange={(value) => updatePreferences({ pushEnabled: value })}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={rowStyle}>
          <Text style={{ color: colors.text }}>E-mail</Text>
          <Switch
            value={preferences.emailEnabled}
            onValueChange={(value) => updatePreferences({ emailEnabled: value })}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Ditado por voz</Text>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Idioma da transcrição
        </Text>
        <View style={styles.segmentedRow}>
          {LOCALE_OPTIONS.map((option) => {
            const selected = voiceLocale === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleVoiceLocaleChange(option.value)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? '#FFFFFF' : colors.text,
                    fontWeight: selected ? '700' : '600',
                    fontSize: fontSize.sm,
                  }}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Info</Text>
        <View style={styles.infoBox}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>ArkIve</Text>
          <Text style={{ color: colors.textSecondary }}>Versão 1.0.0</Text>
          <Text style={{ color: colors.textSecondary }}>
            © 2026 ArkIve — Gestão veterinária otimizada
          </Text>
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  section: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  segmentedRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xs,
  },
  infoBox: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
