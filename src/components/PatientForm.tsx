import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { AppInput } from './AppInput';
import { AppButton } from './AppButton';
import { ChipGroup } from './ChipGroup';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { useEspecies, useRacas } from '../hooks/useLookups';
import type { AnimalRequestInput } from '../services/patientService';
import { spacing, fontSize } from '../styles/theme';

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
  const { t } = useTranslation();

  const SEXO_OPTIONS = [
    { value: 'M', label: t('common.male') },
    { value: 'F', label: t('common.female') },
  ];

  const CASTRADO_OPTIONS = [
    { value: 'S', label: t('common.yes') },
    { value: 'N', label: t('common.no') },
  ];

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
      setValidationError(t('patientForm.validationNoName'));
      return;
    }
    if (!especieId) {
      setValidationError(t('patientForm.validationNoSpecies'));
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
      <AppInput
        label={t('patientForm.nameLabel')}
        placeholder={t('patientForm.namePlaceholder')}
        value={nome}
        onChangeText={setNome}
      />
      {duplicateWarning ? (
        <Text style={{ color: colors.warning, fontSize: fontSize.sm, marginTop: -spacing.sm, marginBottom: spacing.sm }}>
          {duplicateWarning}
        </Text>
      ) : null}

      <ChipGroup
        label={t('patientForm.speciesLabel')}
        options={especieOptions}
        value={especieId != null ? String(especieId) : null}
        onChange={handleEspecieChange}
        emptyMessage={especiesLoading ? t('patientForm.loadingSpecies') : t('patientForm.noSpecies')}
      />

      <ChipGroup
        label={t('patientForm.breedLabel')}
        options={racaOptions}
        value={racaId != null ? String(racaId) : null}
        onChange={(value) => setRacaId(Number(value))}
        disabled={!especieId}
        emptyMessage={
          !especieId
            ? t('patientForm.selectSpeciesFirst')
            : racasLoading
              ? t('patientForm.loadingBreeds')
              : t('patientForm.noBreeds')
        }
      />

      <ChipGroup label={t('patientForm.sexLabel')} options={SEXO_OPTIONS} value={sexo} onChange={(v) => setSexo(v as 'M' | 'F')} />

      <ChipGroup
        label={t('patientForm.neuteredLabel')}
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
