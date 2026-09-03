import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
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

/** Same bottom-sheet-Modal / local-draft architecture as DateField — see the note there. */
export function TimeField({ label, value, onChange, error }: Props) {
  const colors = useThemeColors();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

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
    setDraft(value ?? new Date());
    setIosOpen(true);
  };

  const confirm = () => {
    onChange(draft);
    setIosOpen(false);
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

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setIosOpen(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirm}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: fontSize.sm }}>Concluído</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              is24Hour
              display="spinner"
              locale="pt-BR"
              onValueChange={(_event, selected) => setDraft(selected)}
            />
          </View>
        </Modal>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
});
