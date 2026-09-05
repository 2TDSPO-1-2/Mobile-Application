import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { DateField } from './DateField';
import { useThemeColors } from '../hooks/useThemeColors';
import type { PrescricaoRequestInput, ViaAdministracao } from '../services/prescricaoService';
import { VIA_ADMINISTRACAO_OPTIONS, viaAdministracaoLabel } from '../utils/viaAdministracao';
import { spacing, fontSize, radius } from '../styles/theme';

export interface PrescricaoFormValues {
  medicamento: string;
  dosagem: string;
  frequencia: string;
  viaAdministracao: ViaAdministracao | null;
  /** ISO YYYY-MM-DD — the exact format the backend persists and returns. */
  dataInicio: string;
  /** ISO YYYY-MM-DD, or empty when not set. */
  dataFim: string;
  instrucoes: string;
}

/**
 * Parses/formats a date-only ISO string as a LOCAL calendar date (never
 * `new Date(isoString)`/`.toISOString()`, both of which are UTC-based and
 * can silently shift the day by one depending on the device's timezone
 * offset — the exact bug this app has already hit once with `dataHora`).
 */
function parseIsoDateLocal(value?: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function formatIsoDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface Props {
  patientName: string;
  consultaLabel: string;
  initialValues?: PrescricaoFormValues;
  onSubmit: (input: Omit<PrescricaoRequestInput, 'consultaId'>) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  submitLabel: string;
}

/**
 * Shared by create and edit — unlike the veterinarian-conclusion-vs-AI rule,
 * there's no authority concern prefilling this from an existing prescription
 * on edit: it's the same resource, normal editing. `consultaId` never
 * appears in this form at all — it's supplied by the screen via the
 * useCreatePrescricao/useUpdatePrescricao hook parameter, never typed.
 */
export function PrescricaoForm({
  patientName,
  consultaLabel,
  initialValues,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel,
}: Props) {
  const colors = useThemeColors();

  const [medicamento, setMedicamento] = useState(initialValues?.medicamento ?? '');
  const [dosagem, setDosagem] = useState(initialValues?.dosagem ?? '');
  const [frequencia, setFrequencia] = useState(initialValues?.frequencia ?? '');
  const [viaAdministracao, setViaAdministracao] = useState<ViaAdministracao | null>(
    initialValues?.viaAdministracao ?? null
  );
  const [dataInicio, setDataInicio] = useState<Date | null>(
    parseIsoDateLocal(initialValues?.dataInicio)
  );
  const [dataFim, setDataFim] = useState<Date | null>(parseIsoDateLocal(initialValues?.dataFim));
  const [instrucoes, setInstrucoes] = useState(initialValues?.instrucoes ?? '');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    setValidationError('');

    if (!medicamento.trim()) {
      setValidationError('Informe o medicamento.');
      return;
    }
    if (!dosagem.trim()) {
      setValidationError('Informe a dosagem.');
      return;
    }
    if (!dataInicio) {
      setValidationError('Informe a data de início do tratamento.');
      return;
    }

    const isoInicio = formatIsoDateLocal(dataInicio);
    const isoFim = dataFim ? formatIsoDateLocal(dataFim) : undefined;

    if (isoFim && isoFim < isoInicio) {
      setValidationError('A data de término não pode ser anterior à data de início.');
      return;
    }

    onSubmit({
      medicamento: medicamento.trim(),
      dosagem: dosagem.trim(),
      frequencia: frequencia.trim() || undefined,
      viaAdministracao: viaAdministracao ?? undefined,
      dataInicio: isoInicio,
      dataFim: isoFim,
      instrucoes: instrucoes.trim() || undefined,
    });
  };

  return (
    <AppCard>
      <Text style={[styles.context, { color: colors.textSecondary }]}>
        {patientName}
        {consultaLabel ? ` · ${consultaLabel}` : ''}
      </Text>

      <AppInput
        label="Medicamento"
        placeholder="Ex.: Amoxicilina com clavulanato"
        value={medicamento}
        onChangeText={setMedicamento}
        editable={!isSubmitting}
      />

      <AppInput
        label="Dosagem"
        placeholder="Ex.: 1 comprimido"
        value={dosagem}
        onChangeText={setDosagem}
        editable={!isSubmitting}
      />

      <AppInput
        label="Frequência"
        placeholder="Ex.: 12/12h"
        value={frequencia}
        onChangeText={setFrequencia}
        editable={!isSubmitting}
      />

      <Text style={[styles.label, { color: colors.text }]}>Via de administração</Text>
      <View style={styles.chipRow}>
        {VIA_ADMINISTRACAO_OPTIONS.map((option) => (
          <Pressable
            key={option}
            disabled={isSubmitting}
            onPress={() => setViaAdministracao(option)}
            style={[
              styles.chip,
              {
                backgroundColor: viaAdministracao === option ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: viaAdministracao === option ? '#FFF' : colors.text }}>
              {viaAdministracaoLabel(option)}
            </Text>
          </Pressable>
        ))}
      </View>

      <DateField label="Data de início" value={dataInicio} onChange={setDataInicio} />

      <DateField label="Data de término (opcional)" value={dataFim} onChange={setDataFim} />

      <AppInput
        label="Instruções"
        placeholder="Instruções adicionais para o responsável"
        value={instrucoes}
        onChangeText={setInstrucoes}
        editable={!isSubmitting}
        multiline
      />

      {validationError || errorMessage ? (
        <Text style={{ color: colors.error, marginBottom: spacing.sm }}>
          {validationError || errorMessage}
        </Text>
      ) : null}

      <AppButton
        title={isSubmitting ? 'Salvando...' : submitLabel}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  context: { fontSize: fontSize.xs, marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
});
