import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { PatientForm } from '../components/PatientForm';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePatient, useUpdatePatient } from '../hooks/usePatients';
import { describePatientError } from '../utils/errorMessages';
import type { AnimalRequestInput } from '../services/patientService';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing } from '../styles/theme';

/**
 * Basic-metadata edit only, matching the backend's own restriction for
 * VETERINARIO (`AnimalService.requestAutorizadoParaAtualizacao`): nome,
 * espécie, raça, sexo, castrado. No clínica/status field exists here — the
 * backend rejects either change from this role regardless.
 */
export function EditPatientScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'EditarPaciente'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { patientId } = route.params;

  const { data: patient, isPending, isError, error: loadError } = usePatient(patientId);
  const updateMutation = useUpdatePatient(patientId);
  const [error, setError] = useState('');

  const handleSubmit = async (payload: AnimalRequestInput) => {
    setError('');
    try {
      await updateMutation.mutateAsync(payload);
      navigation.goBack();
    } catch (err) {
      setError(describePatientError(err, true));
    }
  };

  if (isPending) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Editar Paciente" />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          Carregando paciente...
        </Text>
      </View>
    );
  }

  if (isError || !patient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Editar Paciente" />
        <ScreenContainer>
          <EmptyState
            title="Não foi possível carregar"
            message={loadError instanceof Error ? loadError.message : 'Paciente não encontrado.'}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Editar Paciente" />
      <ScreenContainer>
        <PatientForm
          initialValues={{
            nome: patient.nome,
            especieId: patient.especieId,
            racaId: patient.racaId,
            sexo: patient.sexo,
            castrado: patient.castrado,
          }}
          onSubmit={handleSubmit}
          submitting={updateMutation.isPending}
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
