import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';
import { CalendarGlyph } from './CalendarGlyph';

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
}

function formatBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

/**
 * Android uses the library's own recommended imperative dialog
 * (`DateTimePickerAndroid.open`) — there is no embedded view to lay out, so
 * there's nothing that can render invisible. iOS has no equivalent
 * system-level modal for an embedded `display="spinner"` picker, so it's
 * shown inline under the field with a manual "Concluído" button.
 *
 * `onChange` is deliberately never used — it's deprecated in the installed
 * 9.1.0 typings in favor of `onValueChange`/`onDismiss`.
 */
export function DateField({ label, value, onChange, error }: Props) {
  const colors = useThemeColors();
  const [iosOpen, setIosOpen] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        onValueChange: (_event, selected) => onChange(selected),
      });
      return;
    }
    setIosOpen(true);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[commonStyles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        onPress={openPicker}
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.inputBorder },
        ]}
      >
        <Text style={{ color: value ? colors.text : colors.textSecondary, fontSize: fontSize.md }}>
          {value ? formatBR(value) : 'DD/MM/AAAA'}
        </Text>
        <CalendarGlyph color={colors.primary} />
      </Pressable>
      {error ? <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text> : null}

      {iosOpen && Platform.OS === 'ios' ? (
        <View style={[styles.iosSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="date"
            display="spinner"
            locale="pt-BR"
            onValueChange={(_event, selected) => onChange(selected)}
          />
          <Pressable onPress={() => setIosOpen(false)} style={styles.doneBtn}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm }}>Concluído</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
  },
  // No `overflow: 'hidden'` here — clipping this container before the
  // native spinner subview reports its own intrinsic size is what made the
  // picker render invisible on device.
  iosSheet: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  doneBtn: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
