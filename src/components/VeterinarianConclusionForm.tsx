import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { useThemeColors } from '../hooks/useThemeColors';
import type { FinalizarConsultaRequest, Severidade } from '../services/consultaService';
import { spacing, fontSize, radius } from '../styles/theme';

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
 * decision. `doencaId` is always submitted as `null` — there is no backend
 * endpoint this app can use to look one up (see consultaService.ts).
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
    <AppCard>
      <Text style={[styles.title, { color: colors.primary }]}>Conclusão do veterinário</Text>
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        Registre sua avaliação e decisão clínica final. Esta conclusão é independente do apoio de
        IA acima — nada é preenchido automaticamente.
      </Text>

      <AppInput
        label="Diagnóstico"
        placeholder="Diagnóstico definido pelo veterinário"
        value={diagnostico}
        onChangeText={setDiagnostico}
        editable={!isSubmitting}
        multiline
      />

      <Text style={[styles.label, { color: colors.text }]}>Severidade</Text>
      <View style={styles.chipRow}>
        {SEVERIDADE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            disabled={isSubmitting}
            onPress={() => setSeveridade(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: severidade === option.value ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: severidade === option.value ? '#FFF' : colors.text }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <AppInput
        label="Conclusão clínica"
        placeholder="Conduta, orientações e observações finais"
        value={conclusao}
        onChangeText={setConclusao}
        editable={!isSubmitting}
        multiline
      />

      {validationError || errorMessage ? (
        <Text style={{ color: colors.error, marginBottom: spacing.sm }}>
          {validationError || errorMessage}
        </Text>
      ) : null}

      <AppButton
        title={isSubmitting ? 'Finalizando consulta...' : 'Finalizar consulta'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.xs },
  disclaimer: { fontSize: fontSize.xs, lineHeight: 17, marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
