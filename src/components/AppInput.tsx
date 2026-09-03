import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

export function AppInput({ label, error, helperText, style, onFocus, onBlur, editable, ...props }: Props) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);

  // Typed via TextInputProps itself (not a named FocusEvent/BlurEvent import)
  // so this keeps compiling regardless of how RN names that type internally.
  const handleFocus: TextInputProps['onFocus'] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps['onBlur'] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  const borderColor = error ? colors.error : focused ? colors.primary : colors.inputBorder;

  return (
    <View style={[styles.wrap, editable === false && styles.disabled]}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: focused && !error ? 2 : 1.5,
            color: colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[commonStyles.helperText, { color: colors.textSecondary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  disabled: { opacity: 0.56 },
  input: {
    minHeight: 44,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
  },
});
