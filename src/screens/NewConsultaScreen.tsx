import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { SearchBar } from '../components/SearchBar';
import { DateField } from '../components/DateField';
import { TimeField } from '../components/TimeField';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useClinicPatients } from '../hooks/usePatients';
import { useConsultas, useCreateConsulta } from '../hooks/useConsultas';
import type { AnimalDto } from '../services/patientService';
import type { Modalidade } from '../services/consultaService';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize, radius } from '../styles/theme';
import { commonStyles } from '../styles/common';

const MODALIDADES: { value: Modalidade; label: string }[] = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'REMOTA', label: 'Remota' },
];
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Builds the exact `LocalDateTime` string Spring expects — local wall-clock
 * time, zero-padded, no timezone/UTC conversion (`ConsultaRequest.dataHora`
 * is a `LocalDateTime`, not an `Instant`/`OffsetDateTime`).
 */
function toLocalDateTimeString(date: Date, time: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:00`;
}

export function NewConsultaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'CriarConsulta'>>();
  const colors = useThemeColors();

  // The backend has no endpoint for "which veterinarian am I" (see
  // consultaService.ts). Since GET /api/consultas is scoped server-side to
  // the authenticated veterinarian, any consultation already in that list
  // carries the correct veterinarioId — reusing the same query here costs no
  // extra request if ConsultasScreen already fetched it.
  const { data: ownConsultas, isPending: resolvingVeterinario } = useConsultas();
  const veterinarioId = ownConsultas && ownConsultas.length > 0 ? ownConsultas[0].veterinarioId : null;

  const createMutation = useCreateConsulta();

  const [selectedAnimal, setSelectedAnimal] = useState<AnimalDto | null>(null);
  const [changingPatient, setChangingPatient] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalidade, setModalidade] = useState<Modalidade | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  // Returning from "Cadastrar novo paciente" pops back to this exact screen
  // instance with the new patient in params — preselect it without touching
  // modalidade/date/time/motivo already typed.
  useEffect(() => {
    const preselected = route.params?.preselectedAnimal;
    if (preselected) {
      setSelectedAnimal(preselected);
      setChangingPatient(false);
    }
  }, [route.params?.preselectedAnimal]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const trimmedSearch = debouncedSearch.trim();
  // No `enabled` gate anymore — the clinic patient list loads immediately
  // with no `nome` filter (server-side "all active clinic patients"), and
  // simply re-queries with the typed term once the debounce settles. Same
  // endpoint either way (`GET /api/animais/clinica`), no client-side fake
  // filtering, server stays the source of truth.
  const {
    data: clinicPatients,
    isPending: patientsPending,
    isError: patientsError,
  } = useClinicPatients({ nome: trimmedSearch || undefined });

  const handleSelectAnimal = (animal: AnimalDto) => {
    setSelectedAnimal(animal);
    setChangingPatient(false);
  };

  const canIdentifyVeterinario = !resolvingVeterinario && veterinarioId != null;

  const handleSave = async () => {
    setError('');

    if (!veterinarioId) {
      setError('Não foi possível identificar o veterinário autenticado.');
      return;
    }
    if (!selectedAnimal) {
      setError('Selecione um paciente.');
      return;
    }
    if (!modalidade) {
      setError('Selecione a modalidade da consulta.');
      return;
    }
    if (!date) {
      setError('Selecione uma data para a consulta.');
      return;
    }
    if (!time) {
      setError('Selecione um horário para a consulta.');
      return;
    }
    if (!motivo.trim()) {
      setError('Descreva o motivo da consulta.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        animalId: selectedAnimal.id,
        veterinarioId,
        modalidade,
        dataHora: toLocalDateTimeString(date, time),
        motivo: motivo.trim(),
      });

      navigation.replace('ConsultaDetalhe', { consultaId: created.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a consulta.');
    }
  };

  const formDisabled = useMemo(
    () => resolvingVeterinario || !canIdentifyVeterinario,
    [resolvingVeterinario, canIdentifyVeterinario]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Nova Consulta" />

      <ScreenContainer>
        {resolvingVeterinario ? (
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Carregando dados do veterinário...
          </Text>
        ) : !canIdentifyVeterinario ? (
          <EmptyState
            title="Não foi possível identificar o veterinário"
            message="Isso acontece quando esta conta ainda não possui nenhuma consulta registrada. Peça a um administrador da clínica para cadastrar a primeira consulta, ou tente novamente mais tarde."
          />
        ) : (
          <>
            {/* PACIENTE */}
            <Text style={[commonStyles.eyebrow, styles.sectionLabelFirst, { color: colors.primary }]}>
              Paciente
            </Text>

            {selectedAnimal && !changingPatient ? (
              <AppCard onPress={() => setChangingPatient(true)}>
                <View style={commonStyles.rowBetween}>
                  <View style={styles.patientTextCol}>
                    <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>
                      {selectedAnimal.nome}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }} numberOfLines={1}>
                      {selectedAnimal.especieNome}
                      {selectedAnimal.racaNome ? ` · ${selectedAnimal.racaNome}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
              </AppCard>
            ) : (
              <>
                <SearchBar
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Buscar paciente da clínica..."
                />

                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  {trimmedSearch ? 'Resultados da busca' : 'Pacientes da clínica'}
                </Text>

                {patientsPending ? (
                  <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
                    Carregando pacientes...
                  </Text>
                ) : patientsError ? (
                  <EmptyState
                    title="Não foi possível carregar pacientes"
                    message="Verifique a conexão com o servidor e tente novamente."
                  />
                ) : clinicPatients && clinicPatients.length > 0 ? (
                  clinicPatients.map((animal) => {
                    const selected = selectedAnimal?.id === animal.id;
                    return (
                      <Pressable
                        key={animal.id}
                        onPress={() => handleSelectAnimal(animal)}
                        style={[
                          styles.patientRow,
                          {
                            backgroundColor: selected ? colors.primaryTint : colors.surface,
                            borderColor: selected ? colors.primaryLight : colors.border,
                          },
                        ]}
                      >
                        <View style={styles.patientTextCol}>
                          <Text
                            style={{ color: colors.text, fontWeight: selected ? '700' : '600' }}
                            numberOfLines={1}
                          >
                            {animal.nome}
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }} numberOfLines={1}>
                            {animal.especieNome}
                            {animal.racaNome ? ` · ${animal.racaNome}` : ''}
                          </Text>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'chevron-forward'}
                          size={selected ? 22 : 18}
                          color={selected ? colors.success : colors.textSecondary}
                        />
                      </Pressable>
                    );
                  })
                ) : trimmedSearch.length > 0 ? (
                  <EmptyState
                    title="Nenhum paciente encontrado"
                    message={`Nenhum paciente encontrado para "${trimmedSearch}".`}
                  />
                ) : (
                  <EmptyState
                    title="Nenhum paciente cadastrado"
                    message="Esta clínica ainda não possui pacientes ativos cadastrados."
                  />
                )}

                <AppButton
                  title="Cadastrar novo paciente"
                  variant="ghost"
                  icon="add"
                  onPress={() => navigation.navigate('NovoPaciente')}
                />
              </>
            )}

            {/* MODALIDADE */}
            <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
              Modalidade
            </Text>
            <View style={styles.segmentedRow}>
              {MODALIDADES.map((option) => {
                const selected = modalidade === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setModalidade(option.value)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? '#FFFFFF' : colors.text,
                        fontWeight: selected ? '700' : '600',
                        fontSize: fontSize.md,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* DATA E HORÁRIO */}
            <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
              Data e horário
            </Text>
            <DateField label="Data" value={date} onChange={setDate} />
            <TimeField label="Horário" value={time} onChange={setTime} />

            {/* MOTIVO */}
            <Text style={[commonStyles.eyebrow, styles.sectionLabel, { color: colors.primary }]}>
              Motivo
            </Text>
            <AppInput
              label="Descrição"
              placeholder="Descreva o motivo da consulta"
              value={motivo}
              onChangeText={setMotivo}
              multiline
            />

            {error ? <Text style={{ color: colors.error, marginBottom: spacing.sm }}>{error}</Text> : null}

            <AppButton
              title="Criar consulta"
              onPress={handleSave}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || formDisabled}
              style={styles.submitButton}
            />
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Tighter spacing within a section (label -> its controls), noticeably
  // larger spacing between sections — the "browser form" feel came from
  // every label/control using the same uniform gap regardless of grouping.
  sectionLabelFirst: { marginBottom: spacing.sm },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
  subLabel: { fontSize: fontSize.xs, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.xs },
  patientTextCol: { flexShrink: 1, marginRight: spacing.sm },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  segmentedRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  submitButton: { marginTop: spacing.xl },
});
