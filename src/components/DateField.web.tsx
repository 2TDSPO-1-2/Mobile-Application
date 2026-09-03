import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
}

function toInputValue(date: Date | null): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * This file only bundles for the web target (`.web.tsx` platform
 * extension), so a raw DOM `<input>` — react-native-web renders to actual
 * DOM, and lowercase JSX tags map straight to host elements — is the
 * smallest way to get a real, ArkIve-styled date picker on Expo Web without
 * pulling in a calendar UI library.
 */
export function DateField({ label, value, onChange, error }: Props) {
  const colors = useThemeColors();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (!raw) return;
    const [y, m, d] = raw.split('-').map(Number);
    onChange(new Date(y, m - 1, d));
  };

  return (
    <View style={styles.wrap}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>
      <input
        type="date"
        value={toInputValue(value)}
        onChange={handleChange}
        style={{
          display: 'block',
          width: '100%',
          height: 44,
          borderRadius: radius.sm,
          border: `1.5px solid ${error ? colors.error : colors.inputBorder}`,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
          fontSize: fontSize.md,
          fontFamily: 'inherit',
          color: colors.text,
          backgroundColor: colors.surface,
          boxSizing: 'border-box',
        }}
      />
      {error ? <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
});
