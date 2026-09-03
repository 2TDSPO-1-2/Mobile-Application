import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

const MODALIDADES: Modalidade[] = ['PRESENCIAL', 'REMOTA'];
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
  const {
    data: searchResults,
    isPending: searchPending,
    isError: searchError,
  } = useClinicPatients({ nome: trimmedSearch }, { enabled: trimmedSearch.length > 0 });

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
            <Text style={[commonStyles.label, { color: colors.text }]}>Paciente</Text>

            {selectedAnimal && !changingPatient ? (
              <AppCard onPress={() => setChangingPatient(true)}>
                <View style={commonStyles.rowBetween}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{selectedAnimal.nome}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                      {selectedAnimal.especieNome}
                      {selectedAnimal.racaNome ? ` · ${selectedAnimal.racaNome}` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: colors.success, fontSize: fontSize.lg, fontWeight: '700' }}>✓</Text>
                </View>
              </AppCard>
            ) : (
              <>
                <SearchBar
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Buscar paciente da clínica..."
                />

                {trimmedSearch.length === 0 ? null : searchPending ? (
                  <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
                    Buscando pacientes...
                  </Text>
                ) : searchError ? (
                  <EmptyState
                    title="Não foi possível buscar pacientes"
                    message="Verifique a conexão com o servidor e tente novamente."
                  />
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((animal) => (
                    <Pressable
                      key={animal.id}
                      onPress={() => handleSelectAnimal(animal)}
                      style={[
                        styles.optionBtn,
                        {
                          backgroundColor:
                            selectedAnimal?.id === animal.id ? colors.primaryTint : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: selectedAnimal?.id === animal.id ? '700' : '400',
                          }}
                        >
                          {animal.nome}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                          {animal.especieNome}
                          {animal.racaNome ? ` · ${animal.racaNome}` : ''}
                        </Text>
                      </View>
                      {selectedAnimal?.id === animal.id ? (
                        <Text style={{ color: colors.success, fontWeight: '700' }}>✓</Text>
                      ) : null}
                    </Pressable>
                  ))
                ) : (
                  <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
                    Nenhum paciente encontrado com esse nome.
                  </Text>
                )}

                {trimmedSearch.length > 0 && !searchPending ? (
                  <AppButton
                    title="+ Cadastrar novo paciente"
                    variant="ghost"
                    onPress={() => navigation.navigate('NovoPaciente')}
                  />
                ) : null}
              </>
            )}

            <Text style={[commonStyles.label, { color: colors.text, marginTop: spacing.md }]}>Modalidade</Text>
            <View style={styles.chipRow}>
              {MODALIDADES.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setModalidade(option)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: modalidade === option ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: modalidade === option ? '#FFF' : colors.text }}>
                    {option === 'PRESENCIAL' ? 'Presencial' : 'Remota'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <DateField label="Data" value={date} onChange={setDate} />
            <TimeField label="Horário" value={time} onChange={setTime} />
            <AppInput
              label="Motivo"
              placeholder="Descreva o motivo da consulta"
              value={motivo}
              onChangeText={setMotivo}
              multiline
            />

            {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}

            <AppButton
              title="Criar consulta"
              onPress={handleSave}
              loading={createMutation.isPending}
              disabled={createMutation.isPending || formDisabled}
            />
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
});
