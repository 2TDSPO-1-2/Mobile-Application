import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppointmentStatus } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';

const LABELS: Record<AppointmentStatus, string> = {
  solicitada: 'Solicitada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

interface Props {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: Props) {
  const colors = useThemeColors();

  const bgMap: Record<AppointmentStatus, string> = {
    solicitada: colors.warning,
    confirmada: colors.primary,
    realizada: colors.success,
    cancelada: colors.error,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[status] }]}>
      <Text style={styles.text}>{LABELS[status]}</Text>
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
