import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
import { useClinicalVoiceRecording } from '../hooks/useClinicalVoiceRecording';
import type { IdiomaTranscricao } from '../services/transcricaoService';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { spacing, fontSize, radius } from '../styles/theme';

export type NarrativeStatusTone = 'neutral' | 'saving' | 'saved' | 'error';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  editable: boolean;
  statusLabel?: string;
  statusTone?: NarrativeStatusTone;
  errorMessage?: string;
}

const LOCALE_OPTIONS: { value: IdiomaTranscricao; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English' },
];

/** Appends a transcribed segment after whatever's already in the draft, never replacing it. */
function appendSegment(existing: string, segment: string): string {
  const trimmed = existing.replace(/\s+$/, '');
  return trimmed ? `${trimmed}\n\n${segment}` : segment;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Controlled text editor for the clinical narrative — `value`/`onChangeText`
 * is the only contract ConsultaDetailScreen sees; it has no idea voice
 * recording exists on the other side of this component. Recording ->
 * upload -> transcription only ever calls `onChangeText` with appended
 * text, exactly like a keyboard keystroke would. There is no second
 * narrative field, no PATCH call, and no path from a transcription result
 * to the AI endpoint — this component only ever produces local draft text.
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
  const [locale, setLocale] = useState<IdiomaTranscricao>('pt-BR');

  useEffect(() => {
    getJson<IdiomaTranscricao>(STORAGE_KEYS.voiceLocale, 'pt-BR').then(setLocale);
  }, []);

  const handleLocaleChange = (next: IdiomaTranscricao) => {
    setLocale(next);
    setJson(STORAGE_KEYS.voiceLocale, next);
  };

  const voice = useClinicalVoiceRecording((transcript) => {
    onChangeText(appendSegment(value, transcript));
  });

  const toneColor: Record<NarrativeStatusTone, string> = {
    neutral: colors.textSecondary,
    saving: colors.primary,
    saved: colors.success,
    error: colors.error,
  };

  const controlsDisabled = !editable || voice.status === 'transcribing';

  return (
    <View style={styles.wrap}>
      <AppInput
        label="Narrativa clínica"
        placeholder="Descreva o exame clínico, sintomas observados e evolução do caso."
        value={value}
        onChangeText={onChangeText}
        editable={editable && voice.status !== 'recording'}
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

      <View style={styles.voiceSection}>
        <Text style={[styles.voiceLabel, { color: colors.textSecondary }]}>Idioma da voz</Text>
        <View style={styles.chipRow}>
          {LOCALE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              disabled={controlsDisabled || voice.status === 'recording'}
              onPress={() => handleLocaleChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: locale === option.value ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: locale === option.value ? '#FFF' : colors.text,
                  fontSize: fontSize.xs,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {voice.status === 'recording' ? (
          <>
            <Text style={[styles.recordingLabel, { color: colors.error }]}>
              Gravando... {formatDuration(voice.durationSeconds)}
            </Text>
            <AppButton
              title="Parar"
              variant="danger"
              onPress={() => voice.stopAndTranscribe(locale)}
              accessibilityLabel="Parar gravação e transcrever"
            />
          </>
        ) : voice.status === 'transcribing' ? (
          <AppButton title="Transcrevendo..." variant="outline" onPress={() => {}} loading disabled />
        ) : (
          <AppButton
            title="Ditado por voz"
            variant="outline"
            onPress={voice.start}
            disabled={controlsDisabled}
            accessibilityLabel="Iniciar ditado da narrativa clínica"
          />
        )}

        {voice.status === 'error' && voice.errorMessage ? (
          <View>
            <Text style={[styles.status, { color: colors.error }]}>{voice.errorMessage}</Text>
            {voice.permanentlyDenied ? (
              <Text style={[styles.status, { color: colors.textSecondary }]}>
                Ative a permissão de microfone nas configurações do sistema para usar o ditado.
                A narrativa continua disponível pelo teclado.
              </Text>
            ) : voice.canRetry ? (
              <AppButton
                title="Tentar transcrever novamente"
                variant="outline"
                onPress={() => voice.retry(locale)}
              />
            ) : null}
          </View>
        ) : null}

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          O texto transcrito pode conter erros — revise antes de salvar.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  input: { minHeight: 140, textAlignVertical: 'top' },
  status: { fontSize: fontSize.xs, marginTop: -spacing.xs, marginBottom: spacing.xs },
  voiceSection: { marginTop: spacing.xs },
  voiceLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1 },
  recordingLabel: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: spacing.xs },
  disclaimer: { fontSize: fontSize.xs, marginTop: spacing.xs },
});
