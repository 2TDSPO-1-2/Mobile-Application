import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { VoiceOrb } from './VoiceOrb';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { useClinicalVoiceRecording } from '../hooks/useClinicalVoiceRecording';
import { spacing, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

/** Appends a transcribed segment after whatever's already in the draft, never replacing it. */
function appendSegment(existing: string, segment: string): string {
  const trimmed = existing.replace(/\s+$/, '');
  return trimmed ? `${trimmed}\n\n${segment}` : segment;
}

interface Props {
  animalNome: string;
  contextLine: string;
  motivo?: string;
  initialNarrativa: string;
  /** Persists the narrative, then (only on success) the caller navigates to the analysis screen. Rejecting keeps the veterinarian here with the draft intact. */
  onAnalyze: (narrativa: string) => Promise<void>;
  analyzing: boolean;
}

/**
 * The signature ArkIve clinical intake experience — replaces the old
 * status-card + narrative-textarea + voice-language-chips + Salvar +
 * Solicitar-apoio-clínico form. Voice is primary (a big orb), manual typing
 * is a first-class fallback, and there is no separate "save" step: the
 * narrative is only ever persisted as part of "Analisar com ArkIve".
 *
 * Wraps `useClinicalVoiceRecording` unchanged — permission handling, the
 * `.m4a` recorder, upload, transcription, retry, and temp-file cleanup are
 * all exactly the existing hook. This component is purely the visual/state
 * layer choosing what to show around it.
 */
export function ClinicalIntake({
  animalNome,
  contextLine,
  motivo,
  initialNarrativa,
  onAnalyze,
  analyzing,
}: Props) {
  const colors = useThemeColors();
  const { t, language } = useTranslation();
  // Initial value only — a background refetch changing the underlying
  // consulta doesn't remount this component (same consultaId, same EP
  // status), so this never gets silently overwritten while the
  // veterinarian is mid-edit.
  const [draft, setDraft] = useState(initialNarrativa);
  const [view, setView] = useState<'orb' | 'editor'>(initialNarrativa.trim() ? 'editor' : 'orb');
  const [analyzeError, setAnalyzeError] = useState('');

  // The app-wide language IS the voice-dictation locale — one setting, no
  // separate read from Settings needed here anymore (see src/i18n/store.ts).
  const locale = language;

  const voice = useClinicalVoiceRecording((transcript) => {
    setDraft((current) => appendSegment(current, transcript));
    setView('editor');
  });

  // Manual entry must remain reachable if voice is permanently unusable.
  useEffect(() => {
    if (voice.permanentlyDenied) setView('editor');
  }, [voice.permanentlyDenied]);

  const handleOrbPress = () => {
    if (voice.status === 'idle') voice.start();
    else if (voice.status === 'recording') voice.stopAndTranscribe(locale);
  };

  const handleAnalyzePress = async () => {
    setAnalyzeError('');
    if (!draft.trim()) {
      setAnalyzeError(t('clinicalIntake.validationEmpty'));
      return;
    }
    try {
      await onAnalyze(draft);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : t('clinicalIntake.saveFallbackError'));
    }
  };

  const showOrbArea = view === 'orb' || voice.status === 'recording' || voice.status === 'transcribing';

  return (
    <View>
      <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
        {animalNome}
      </Text>
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }} numberOfLines={2}>
        {contextLine}
      </Text>
      {motivo ? (
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
          {t('consultaDetail.reasonLabel', { reason: motivo })}
        </Text>
      ) : null}

      <Text style={[styles.question, { color: colors.text }]}>{t('clinicalIntake.question', { name: animalNome })}</Text>
      {showOrbArea ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('clinicalIntake.subtitle')}</Text>
      ) : null}

      {showOrbArea ? (
        <>
          <VoiceOrb
            mode={
              voice.status === 'recording'
                ? 'recording'
                : voice.status === 'transcribing'
                  ? 'transcribing'
                  : 'idle'
            }
            durationSeconds={voice.durationSeconds}
            meteringLevel={voice.meteringLevel}
            onPress={handleOrbPress}
          />

          {voice.status === 'idle' ? (
            <Pressable onPress={() => setView('editor')} style={styles.linkWrap} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('clinicalIntake.typeNarrative')}</Text>
            </Pressable>
          ) : null}

          {voice.status === 'error' && voice.errorMessage ? (
            <View style={styles.errorBlock}>
              <Text style={{ color: colors.error, textAlign: 'center' }}>{voice.errorMessage}</Text>
              {voice.permanentlyDenied ? (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
                  {t('clinicalIntake.micPermissionDenied')}
                </Text>
              ) : voice.canRetry ? (
                <AppButton
                  title={t('clinicalIntake.retryTranscription')}
                  variant="outline"
                  onPress={() => voice.retry(locale)}
                />
              ) : null}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Text style={[commonStyles.eyebrow, { color: colors.primary, marginBottom: spacing.sm }]}>
            {t('clinicalIntake.sectionLabel')}
          </Text>
          <AppInput
            placeholder={t('clinicalIntake.narrativePlaceholder')}
            value={draft}
            onChangeText={setDraft}
            editable={!analyzing}
            multiline
            numberOfLines={10}
            style={styles.editor}
          />
          <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>{t('clinicalIntake.disclaimer')}</Text>

          <AppButton
            title={t('clinicalIntake.addToNarrative')}
            variant="ghost"
            icon="mic-outline"
            onPress={() => setView('orb')}
            disabled={analyzing}
          />
        </>
      )}

      {analyzeError ? (
        <Text style={{ color: colors.error, marginTop: spacing.sm, marginBottom: spacing.sm }}>
          {analyzeError}
        </Text>
      ) : null}

      {view === 'editor' && voice.status === 'idle' ? (
        <AppButton
          title={t('clinicalIntake.analyzeButton')}
          icon="sparkles"
          onPress={handleAnalyzePress}
          loading={analyzing}
          disabled={analyzing || !draft.trim()}
          style={styles.analyzeButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  patientName: { fontSize: fontSize.lg, fontWeight: '700' },
  question: { fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, marginBottom: spacing.md, lineHeight: 20 },
  linkWrap: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.sm },
  errorBlock: { marginTop: spacing.md },
  editor: { minHeight: 240, fontSize: fontSize.lg, lineHeight: 26, textAlignVertical: 'top' },
  disclaimer: { fontSize: fontSize.xs, marginTop: spacing.xs, marginBottom: spacing.md },
  analyzeButton: { marginTop: spacing.lg },
});
