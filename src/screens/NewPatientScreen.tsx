import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { PatientForm } from '../components/PatientForm';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { useCreatePatient } from '../hooks/usePatients';
import { describePatientError } from '../utils/errorMessages';
import type { AnimalRequestInput } from '../services/patientService';
import type { AppStackParamList } from '../interfaces/navigation';

/**
 * Reachable only from NewConsultaScreen's patient search when it comes up
 * empty. On success, navigates back to the SAME CriarConsulta screen
 * instance (still on the stack) with the new patient preselected — it does
 * not push a fresh consultation form, so motivo/date/time typed before
 * "Cadastrar novo paciente" was tapped are untouched.
 *
 * Deliberately no same-name warning: two patients legitimately sharing a
 * name (e.g. "Luna") is normal and must be allowed without friction.
 */
export function NewPatientScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const createMutation = useCreatePatient();

  const [error, setError] = useState('');

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
      <AppHeader title={t('patientForm.newTitle')} />
      <ScreenContainer>
        <PatientForm
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          submitLabel={t('patientForm.createSubmit')}
          errorMessage={error}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
