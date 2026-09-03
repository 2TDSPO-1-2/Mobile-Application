import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePatient } from '../hooks/usePatients';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

/**
 * Read-only patient metadata. Deliberately shows no "owner veterinarian" —
 * that relationship doesn't exist (Animal -> Clínica, not Animal ->
 * Veterinário). No Excluir/Desativar action either: the backend forbids
 * both for VETERINARIO (`AnimalService.exigirPermissaoAdministrativaAnimal`).
 */
export function PatientDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'PacienteDetalhe'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { data: patient, isPending, isError, error, refetch } = usePatient(route.params.patientId);

  if (isPending) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Paciente" />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          Carregando paciente...
        </Text>
      </View>
    );
  }

  if (isError || !patient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Paciente" />
        <ScreenContainer>
          <EmptyState
            title="Não foi possível carregar"
            message={error instanceof Error ? error.message : 'Paciente não encontrado.'}
          />
          <AppButton title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={patient.nome} />
      <ScreenContainer>
        <AppCard>
          <Text style={[commonStyles.eyebrow, { color: colors.primary, marginBottom: spacing.sm }]}>
            Dados do paciente
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>Nome: {patient.nome}</Text>
          <Text style={[styles.field, { color: colors.text }]}>Espécie: {patient.especieNome}</Text>
          <Text style={[styles.field, { color: colors.text }]}>
            Raça: {patient.racaNome ?? 'Não informada'}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>
            Sexo: {patient.sexo === 'M' ? 'Macho' : patient.sexo === 'F' ? 'Fêmea' : 'Não informado'}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>
            Castrado: {patient.castrado === 'S' ? 'Sim' : 'Não'}
          </Text>
          {patient.clinicaNome ? (
            <Text style={[styles.field, { color: colors.textSecondary }]}>Clínica: {patient.clinicaNome}</Text>
          ) : null}
        </AppCard>

        <AppButton
          title="Editar paciente"
          variant="outline"
          onPress={() => navigation.navigate('EditarPaciente', { patientId: patient.id })}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  field: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
