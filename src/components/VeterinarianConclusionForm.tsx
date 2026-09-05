import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
import type { FinalizarConsultaRequest, Severidade } from '../services/consultaService';
import { spacing, fontSize, radius } from '../styles/theme';
import { commonStyles } from '../styles/common';

const SEVERIDADE_OPTIONS: { value: Severidade; label: string }[] = [
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADA', label: 'Moderada' },
  { value: 'GRAVE', label: 'Grave' },
];

interface Props {
  onSubmit: (input: FinalizarConsultaRequest) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

/**
 * Deliberately does not accept any AI-support data as a prop — there is no
 * way for this form to prefill from `hipoteseDiagnostica`/`severidadeSugerida`
 * even by accident, because it never receives them. Every field starts
 * blank; the veterinarian's conclusion is always an independent, active
 * decision (a product invariant enforced structurally, not by a disclaimer
 * paragraph repeated on-screen). `doencaId` is always submitted as `null` —
 * there is no backend endpoint this app can use to look one up (see
 * consultaService.ts).
 *
 * No card wrap — this renders as a plain, centered form directly on the
 * screen background (the AppHeader title above already says "Conclusão do
 * veterinário", so this never repeats it).
 */
export function VeterinarianConclusionForm({ onSubmit, isSubmitting, errorMessage }: Props) {
  const colors = useThemeColors();

  const [diagnostico, setDiagnostico] = useState('');
  const [severidade, setSeveridade] = useState<Severidade | null>(null);
  const [conclusao, setConclusao] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    setValidationError('');

    if (!diagnostico.trim()) {
      setValidationError('Informe o diagnóstico para finalizar a consulta.');
      return;
    }

    onSubmit({
      diagnostico: diagnostico.trim(),
      severidade: severidade ?? undefined,
      doencaId: null,
      conclusao: conclusao.trim() || undefined,
    });
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Registre sua decisão clínica final.
      </Text>

      <View style={styles.section}>
        <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
          Diagnóstico
        </Text>
        <AppInput
          placeholder="Diagnóstico definido pelo veterinário"
          value={diagnostico}
          onChangeText={setDiagnostico}
          editable={!isSubmitting}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
          Severidade
        </Text>
        <View style={styles.severityRow}>
          {SEVERIDADE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              disabled={isSubmitting}
              onPress={() => setSeveridade(option.value)}
              style={[
                styles.severityOption,
                {
                  backgroundColor: severidade === option.value ? colors.primary : colors.surface,
                  borderColor: severidade === option.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.severityLabel,
                  { color: severidade === option.value ? '#FFFFFF' : colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
          Conclusão clínica
        </Text>
        <AppInput
          placeholder="Conduta, orientações e observações finais"
          value={conclusao}
          onChangeText={setConclusao}
          editable={!isSubmitting}
          multiline
          numberOfLines={5}
          style={styles.conclusaoInput}
        />
      </View>

      {validationError || errorMessage ? (
        <Text style={[styles.error, { color: colors.error }]}>{validationError || errorMessage}</Text>
      ) : null}

      <AppButton
        title={isSubmitting ? 'Finalizando consulta...' : 'Finalizar consulta'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
  intro: { fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
  // Larger gap BETWEEN sections, tighter spacing within one (the eyebrow
  // label sits close to its own field via commonStyles.eyebrow + a small
  // marginBottom, not the section's own rhythm).
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.sm },
  severityRow: { flexDirection: 'row', gap: spacing.sm },
  severityOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  severityLabel: { fontSize: fontSize.sm, fontWeight: '700' },
  conclusaoInput: { minHeight: 120, textAlignVertical: 'top' },
  error: { fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  submitButton: { marginTop: spacing.sm },
});
