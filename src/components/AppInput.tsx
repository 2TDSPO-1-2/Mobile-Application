import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function AppInput({ label, error, style, ...props }: Props) {
  const colors = useThemeColors();

  return (
    <View style={styles.wrap}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={[commonStyles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
  },
});
