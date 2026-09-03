import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { ChipGroup } from './ChipGroup';
import { useThemeColors } from '../hooks/useThemeColors';
import { useEspecies, useRacas } from '../hooks/useLookups';
import type { AnimalRequestInput } from '../services/patientService';
import { spacing, fontSize } from '../styles/theme';

const SEXO_OPTIONS = [
  { value: 'M', label: 'Macho' },
  { value: 'F', label: 'Fêmea' },
];

const CASTRADO_OPTIONS = [
  { value: 'S', label: 'Sim' },
  { value: 'N', label: 'Não' },
];

export interface PatientFormValues {
  nome: string;
  especieId: number | null;
  racaId: number | null;
  sexo: 'M' | 'F' | null;
  castrado: 'S' | 'N' | null;
}

interface Props {
  initialValues?: Partial<PatientFormValues>;
  onSubmit: (payload: AnimalRequestInput) => void;
  submitting: boolean;
  submitLabel: string;
  errorMessage?: string;
  /** Section 17: a non-blocking "similar name already exists" hint, computed by the caller from already-loaded clinic results. */
  duplicateWarning?: string;
  /** Mirrors the live `nome` field up to the caller (e.g. to drive the duplicate-name check) without lifting the whole form's state out. */
  onNameChange?: (nome: string) => void;
}

/**
 * Shared by NewPatientScreen and EditPatientScreen. Deliberately has no
 * field for clínica/veterinário/responsável/status — the backend derives or
 * forbids all of those for a VETERINARIO caller (see patientService.ts).
 */
export function PatientForm({
  initialValues,
  onSubmit,
  submitting,
  submitLabel,
  errorMessage,
  duplicateWarning,
  onNameChange,
}: Props) {
  const colors = useThemeColors();

  const [nome, setNomeState] = useState(initialValues?.nome ?? '');
  const setNome = (value: string) => {
    setNomeState(value);
    onNameChange?.(value);
  };
  const [especieId, setEspecieId] = useState<number | null>(initialValues?.especieId ?? null);
  const [racaId, setRacaId] = useState<number | null>(initialValues?.racaId ?? null);
  const [sexo, setSexo] = useState<'M' | 'F' | null>(initialValues?.sexo ?? null);
  const [castrado, setCastrado] = useState<'S' | 'N' | null>(initialValues?.castrado ?? null);
  const [validationError, setValidationError] = useState('');

  const { data: especies, isPending: especiesLoading } = useEspecies();
  const { data: racas, isPending: racasLoading } = useRacas(especieId);

  const especieOptions = useMemo(
    () => (especies ?? []).map((e) => ({ value: String(e.id), label: e.nome })),
    [especies]
  );
  const racaOptions = useMemo(
    () => (racas ?? []).map((r) => ({ value: String(r.id), label: r.nome })),
    [racas]
  );

  // Clear an incompatible breed the moment species changes — the backend
  // rejects a raca/especie mismatch outright (`aplicarDados` in AnimalService).
  const handleEspecieChange = (value: string) => {
    const next = Number(value);
    if (next !== especieId) {
      setEspecieId(next);
      setRacaId(null);
    }
  };

  useEffect(() => {
    if (racaId != null && racas && !racas.some((r) => r.id === racaId)) {
      setRacaId(null);
    }
  }, [racas, racaId]);

  const handleSubmit = () => {
    setValidationError('');

    if (!nome.trim()) {
      setValidationError('Informe o nome do paciente.');
      return;
    }
    if (!especieId) {
      setValidationError('Selecione a espécie do paciente.');
      return;
    }

    onSubmit({
      nome: nome.trim(),
      especieId,
      racaId: racaId ?? undefined,
      sexo: sexo ?? undefined,
      castrado: castrado ?? undefined,
    });
  };

  return (
    <View>
      <AppInput label="Nome" placeholder="Nome do paciente" value={nome} onChangeText={setNome} />
      {duplicateWarning ? (
        <Text style={{ color: colors.warning, fontSize: fontSize.sm, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
          {duplicateWarning}
        </Text>
      ) : null}

      <ChipGroup
        label="Espécie"
        options={especieOptions}
        value={especieId != null ? String(especieId) : null}
        onChange={handleEspecieChange}
        emptyMessage={especiesLoading ? 'Carregando espécies...' : 'Nenhuma espécie disponível.'}
      />

      <ChipGroup
        label="Raça"
        options={racaOptions}
        value={racaId != null ? String(racaId) : null}
        onChange={(value) => setRacaId(Number(value))}
        disabled={!especieId}
        emptyMessage={
          !especieId
            ? 'Selecione a espécie primeiro.'
            : racasLoading
              ? 'Carregando raças...'
              : 'Nenhuma raça cadastrada para esta espécie.'
        }
      />

      <ChipGroup label="Sexo" options={SEXO_OPTIONS} value={sexo} onChange={(v) => setSexo(v as 'M' | 'F')} />

      <ChipGroup
        label="Castrado"
        options={CASTRADO_OPTIONS}
        value={castrado}
        onChange={(v) => setCastrado(v as 'S' | 'N')}
      />

      {validationError || errorMessage ? (
        <Text style={{ color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
          {validationError || errorMessage}
        </Text>
      ) : null}

      <AppButton title={submitLabel} onPress={handleSubmit} loading={submitting} disabled={submitting} />
    </View>
  );
}
