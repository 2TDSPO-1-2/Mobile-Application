import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize } from '../styles/theme';

interface Props {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
