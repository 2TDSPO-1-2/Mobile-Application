import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
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
 * (`DateTimePickerAndroid.open`) — a native window, nothing in our tree to
 * lay out or squish.
 *
 * iOS has no such system-level modal for an embedded `display="spinner"`
 * picker, so it's presented in our own bottom-sheet `Modal` — rendered in
 * its own native layer, immune to the surrounding ScrollView's layout.
 * Spinning the wheel updates a local `draft` only; the parent's `value`
 * (and therefore the picker's own `value` prop) is updated once, on
 * "Concluído" — feeding the live external `value` straight back into the
 * picker on every spin previously fought the wheel's own scroll state and
 * is what made the picker feel unresponsive/"broken".
 *
 * `onChange` (the library prop) is deliberately never used — it's
 * deprecated in the installed 9.1.0 typings in favor of
 * `onValueChange`/`onDismiss`.
 */
export function DateField({ label, value, onChange, error }: Props) {
  const colors = useThemeColors();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
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
          {value ? formatBR(value) : 'DD/MM/AAAA'}
        </Text>
        <CalendarGlyph color={colors.primary} />
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
              mode="date"
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
