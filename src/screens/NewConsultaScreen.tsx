import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePatients } from '../hooks/usePatients';
import { useConsultas, useCreateConsulta } from '../hooks/useConsultas';
import type { Modalidade } from '../services/consultaService';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize, radius } from '../styles/theme';

const MODALIDADES: Modalidade[] = ['PRESENCIAL', 'REMOTA'];

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

export function NewConsultaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();

  const { data: patients, isPending: patientsLoading, isError: patientsError } = usePatients();
  // The backend has no endpoint for "which veterinarian am I" (see
  // consultaService.ts). Since GET /api/consultas is scoped server-side to
  // the authenticated veterinarian, any consultation already in that list
  // carries the correct veterinarioId — reusing the same query here costs no
  // extra request if ConsultasScreen already fetched it.
  const { data: ownConsultas, isPending: resolvingVeterinario } = useConsultas();
  const veterinarioId = ownConsultas && ownConsultas.length > 0 ? ownConsultas[0].veterinarioId : null;

  const createMutation = useCreateConsulta();

  const [animalId, setAnimalId] = useState<number | null>(null);
  const [modalidade, setModalidade] = useState<Modalidade | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const canIdentifyVeterinario = !resolvingVeterinario && veterinarioId != null;

  const handleSave = async () => {
    setError('');

    if (!veterinarioId) {
      setError('Não foi possível identificar o veterinário autenticado.');
      return;
    }
    if (!animalId) {
      setError('Selecione um paciente.');
      return;
    }
    if (!modalidade) {
      setError('Selecione a modalidade da consulta.');
      return;
    }
    if (!date.trim() || !time.trim()) {
      setError('Informe data e horário da consulta.');
      return;
    }
    if (!motivo.trim()) {
      setError('Descreva o motivo da consulta.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        animalId,
        veterinarioId,
        modalidade,
        dataHora: `${toIsoDate(date)}T${time.trim()}:00`,
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
            <Text style={[styles.label, { color: colors.text }]}>Paciente</Text>

            {patientsLoading ? (
              <Text style={{ color: colors.textSecondary }}>Carregando pacientes...</Text>
            ) : patientsError ? (
              <EmptyState
                title="Não foi possível carregar pacientes"
                message="Verifique a conexão com o servidor e tente novamente."
              />
            ) : !patients || patients.length === 0 ? (
              <EmptyState title="Nenhum paciente disponível" />
            ) : (
              patients.map((animal) => (
                <Pressable
                  key={animal.id}
                  onPress={() => setAnimalId(animal.id)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor:
                        animalId === animal.id ? colors.primaryLight : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: animalId === animal.id ? '700' : '400',
                    }}
                  >
                    {animal.nome}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                    {animal.especieNome}
                    {animal.racaNome ? ` · ${animal.racaNome}` : ''}
                  </Text>
                </Pressable>
              ))
            )}

            <Text style={[styles.label, { color: colors.text }]}>Modalidade</Text>
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

            <AppInput label="Data" placeholder="DD-MM-AAAA" value={date} onChangeText={setDate} />
            <AppInput label="Horário" placeholder="HH:MM" value={time} onChangeText={setTime} />
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
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  optionBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
});
