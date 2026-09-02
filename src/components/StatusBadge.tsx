import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import type { StatusPresentation } from '../utils/statusPresentation';

/**
 * Purely presentational — a colored pill for a {label, tone} pair. Domain
 * mapping (which status means which label/tone) lives in
 * src/utils/statusPresentation.ts, so this one component serves both the old
 * Appointment statuses and the real Consulta statuses without forking.
 */
export function StatusBadge({ label, tone }: StatusPresentation) {
  const colors = useThemeColors();

  const toneColor: Record<StatusPresentation['tone'], string> = {
    neutral: colors.textSecondary,
    info: colors.primary,
    warning: colors.warning,
    success: colors.success,
    danger: colors.error,
  };

  return (
    <View style={[styles.badge, { backgroundColor: toneColor[tone] }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
