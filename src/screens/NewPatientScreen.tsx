import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { PatientForm } from '../components/PatientForm';
import { useThemeColors } from '../hooks/useThemeColors';
import { useCreatePatient, useClinicPatients } from '../hooks/usePatients';
import { describePatientError } from '../utils/errorMessages';
import type { AnimalRequestInput } from '../services/patientService';
import type { AppStackParamList } from '../interfaces/navigation';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Reachable only from NewConsultaScreen's patient search when it comes up
 * empty. On success, navigates back to the SAME CriarConsulta screen
 * instance (still on the stack) with the new patient preselected — it does
 * not push a fresh consultation form, so motivo/date/time typed before
 * "Cadastrar novo paciente" was tapped are untouched.
 */
export function NewPatientScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const createMutation = useCreatePatient();
  const { data: clinicPatients } = useClinicPatients();

  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  const duplicateWarning =
    nome.trim().length > 1 &&
    clinicPatients?.some((animal) => normalize(animal.nome) === normalize(nome))
      ? 'Já existe um paciente com nome semelhante nesta clínica.'
      : undefined;

  const handleSubmit = async (payload: AnimalRequestInput) => {
    setError('');
    try {
      const created = await createMutation.mutateAsync(payload);
      navigation.navigate('CriarConsulta', { preselectedAnimal: created });
    } catch (err) {
      setError(describePatientError(err, false));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Novo Paciente" />
      <ScreenContainer>
        <PatientForm
          onNameChange={setNome}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          submitLabel="Cadastrar paciente"
          errorMessage={error}
          duplicateWarning={duplicateWarning}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
