import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius } from '../styles/theme';
import { commonStyles } from '../styles/common';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AppCard({ children, onPress, style }: Props) {
  const colors = useThemeColors();

  const cardStyle = [
    commonStyles.card,
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
});
