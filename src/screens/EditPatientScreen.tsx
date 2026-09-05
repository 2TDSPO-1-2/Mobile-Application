import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { PatientForm } from '../components/PatientForm';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
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
  const { t } = useTranslation();
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
        <AppHeader title={t('patientForm.editTitle')} />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          {t('patientDetail.loading')}
        </Text>
      </View>
    );
  }

  if (isError || !patient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title={t('patientForm.editTitle')} />
        <ScreenContainer>
          <EmptyState
            title={t('patientDetail.loadErrorTitle')}
            message={loadError instanceof Error ? loadError.message : t('patientDetail.notFound')}
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={t('patientForm.editTitle')} />
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
          submitLabel={t('patientForm.editSubmit')}
          errorMessage={error}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
