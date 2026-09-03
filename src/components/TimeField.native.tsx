import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, radius, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';
import { ClockGlyph } from './CalendarGlyph';

interface Props {
  label: string;
  value: Date | null;
  onChange: (time: Date) => void;
  error?: string;
}

function formatHHmm(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Same architecture as DateField — see the note there. */
export function TimeField({ label, value, onChange, error }: Props) {
  const colors = useThemeColors();
  const [iosOpen, setIosOpen] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'time',
        is24Hour: true,
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
          {value ? formatHHmm(value) : 'HH:mm'}
        </Text>
        <ClockGlyph color={colors.primary} />
      </Pressable>
      {error ? <Text style={[commonStyles.errorText, { color: colors.error }]}>{error}</Text> : null}

      {iosOpen && Platform.OS === 'ios' ? (
        <View style={[styles.iosSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="time"
            is24Hour
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
