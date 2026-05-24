import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize } from '../styles/theme';

export function SettingsScreen() {
  const { mode, preferences, setMode, updatePreferences } = useTheme();
  const colors = useThemeColors();
  const rowStyle = [styles.row, { borderBottomColor: colors.border }];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Configurações" />

      <ScreenContainer scroll={false}>
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
  infoBox: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
