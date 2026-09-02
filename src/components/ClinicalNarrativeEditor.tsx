import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppInput } from './AppInput';
import { useThemeColors } from '../hooks/useThemeColors';
import { spacing, fontSize } from '../styles/theme';

export type NarrativeStatusTone = 'neutral' | 'saving' | 'saved' | 'error';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  statusLabel?: string;
  statusTone?: NarrativeStatusTone;
  errorMessage?: string;
}

/**
 * Controlled text editor for the clinical narrative — deliberately just
 * `value`/`onChangeText`, so a future voice-transcription feature can set
 * this same text the keyboard does, with identical save logic downstream.
 * Owns no server-state itself; dirty/saving/saved/error is computed by the
 * screen (see ConsultaDetailScreen.tsx) from the shared useSaveNarrativa
 * mutation, then passed down as statusLabel/statusTone.
 */
export function ClinicalNarrativeEditor({
  value,
  onChangeText,
  editable,
  statusLabel,
  statusTone = 'neutral',
  errorMessage,
}: Props) {
  const colors = useThemeColors();

  const toneColor: Record<NarrativeStatusTone, string> = {
    neutral: colors.textSecondary,
    saving: colors.primary,
    saved: colors.success,
    error: colors.error,
  };

  return (
    <View style={styles.wrap}>
      <AppInput
        label="Narrativa clínica"
        placeholder="Descreva o exame clínico, sintomas observados e evolução do caso."
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline
        numberOfLines={6}
        style={styles.input}
      />

      {statusLabel ? (
        <Text style={[styles.status, { color: toneColor[statusTone] }]}>{statusLabel}</Text>
      ) : null}

      {errorMessage ? (
        <Text style={[styles.status, { color: colors.error }]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  input: { minHeight: 140, textAlignVertical: 'top' },
  status: { fontSize: fontSize.xs, marginTop: -spacing.xs, marginBottom: spacing.xs },
});
