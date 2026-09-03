import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { radius, spacing } from '../styles/theme';
import { shadows } from '../styles/shadows';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /**
   * Left-border accent color — used to distinguish AI-support cards
   * (primary) from veterinarian-confirmed conclusion cards (success),
   * without changing the card's neutral surface otherwise.
   */
  accentColor?: string;
}

export function AppCard({ children, onPress, style, accentColor }: Props) {
  const colors = useThemeColors();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...cardStyle, pressed && { backgroundColor: colors.primaryTint }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
});
