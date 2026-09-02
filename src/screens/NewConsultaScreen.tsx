import React, { useState } from 'react';
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
import { useCreateConsulta } from '../hooks/useConsultas';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize, radius } from '../styles/theme';

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
  const createMutation = useCreateConsulta();

  const [animalId, setAnimalId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');

    if (!animalId) {
      setError('Selecione um paciente.');
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
        dataHora: `${toIsoDate(date)}T${time.trim()}:00`,
        motivo: motivo.trim(),
      });

      if (created?.id != null) {
        navigation.replace('ConsultaDetalhe', { consultaId: created.id });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a consulta.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Nova Consulta" />

      <ScreenContainer>
        <Text style={[styles.notice, { color: colors.textSecondary }]}>
          Este formulário envia os campos que a documentação da API sugere (paciente, data/hora e
          motivo), mas o formato exato ainda não foi confirmado contra uma resposta real do
          backend. Se o servidor rejeitar a criação, isso indica que os nomes de campo precisam
          de ajuste.
        </Text>

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
                  backgroundColor: animalId === animal.id ? colors.primaryLight : colors.surface,
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
          disabled={createMutation.isPending}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notice: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  optionBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
});
