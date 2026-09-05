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
import { useTranslation } from '../i18n/useTranslation';
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
  const { t } = useTranslation();
  const { data: patient, isPending, isError, error, refetch } = usePatient(route.params.patientId);

  if (isPending) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title={t('patientDetail.title')} />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          {t('patientDetail.loading')}
        </Text>
      </View>
    );
  }

  if (isError || !patient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title={t('patientDetail.title')} />
        <ScreenContainer>
          <EmptyState
            title={t('patientDetail.loadErrorTitle')}
            message={error instanceof Error ? error.message : t('patientDetail.notFound')}
          />
          <AppButton title={t('common.tryAgain')} variant="outline" onPress={() => refetch()} />
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
            {t('patientDetail.dataSection')}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>{t('patientDetail.nameLabel', { name: patient.nome })}</Text>
          <Text style={[styles.field, { color: colors.text }]}>
            {t('patientDetail.speciesLabel', { species: patient.especieNome })}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>
            {t('patientDetail.breedLabel', { breed: patient.racaNome ?? t('common.notInformedFeminine') })}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>
            {t('patientDetail.sexLabel', {
              sex:
                patient.sexo === 'M'
                  ? t('common.male')
                  : patient.sexo === 'F'
                    ? t('common.female')
                    : t('common.notInformed'),
            })}
          </Text>
          <Text style={[styles.field, { color: colors.text }]}>
            {t('patientDetail.neuteredLabel', { value: patient.castrado === 'S' ? t('common.yes') : t('common.no') })}
          </Text>
          {patient.clinicaNome ? (
            <Text style={[styles.field, { color: colors.textSecondary }]}>
              {t('patientDetail.clinicLabel', { clinic: patient.clinicaNome })}
            </Text>
          ) : null}
        </AppCard>

        <AppButton
          title={t('patientDetail.editButton')}
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
