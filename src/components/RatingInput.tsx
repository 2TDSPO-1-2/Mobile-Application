import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize } from '../styles/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function RatingInput({ value, onChange, max = 5 }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      {Array.from({ length: max + 1 }, (_, i) => i).map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} style={styles.star}>
          <Text
            style={{
              fontSize: fontSize.xxl,
              color: star <= value ? colors.primary : colors.border,
            }}
          >
            ★
          </Text>
        </Pressable>
      ))}
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {value}/5
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginVertical: spacing.sm,
  },
  star: { padding: spacing.xs },
  label: { marginLeft: spacing.sm, fontSize: fontSize.md },
});
