import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

export interface ChipOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
}

/**
 * Single-select chip row — the same visual pattern NewConsultaScreen already
 * used inline for `modalidade`, extracted so species/breed/sex/castration
 * pickers elsewhere don't each reinvent it.
 */
export function ChipGroup({ label, options, value, onChange, disabled, emptyMessage, error }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>

      {options.length === 0 && emptyMessage ? (
        <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>{emptyMessage}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.row}>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  disabled={disabled}
                  onPress={() => onChange(option.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      opacity: disabled ? 0.56 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#FFF' : colors.text, fontSize: fontSize.sm }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
      {error ? <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
