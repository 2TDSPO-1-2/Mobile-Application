import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmptyState } from '../components/EmptyState';
import { PrescricaoForm } from '../components/PrescricaoForm';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsulta } from '../hooks/useConsultas';
import { useCreatePrescricao } from '../hooks/usePrescricoes';
import { describePrescricaoError } from '../utils/errorMessages';
import { toDisplayDate } from '../utils/isoDate';
import type { PrescricaoRequestInput } from '../services/prescricaoService';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing } from '../styles/theme';

/**
 * Prescriptions only make sense for a finalized consultation
 * (`PrescricaoService.exigirConsultaFinalizada` enforces this server-side
 * regardless). This screen is only ever linked from the FI branch of
 * ConsultaDetailScreen, but it re-checks the live consultation status
 * itself before rendering the form — the prerequisite must hold even if
 * this route is somehow reached directly (deep link, stale nav state).
 */
export function NewPrescricaoScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'NovaPrescricao'>>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { data: consulta, isPending } = useConsulta(consultaId);
  const createMutation = useCreatePrescricao(consultaId);

  const handleSubmit = async (input: Omit<PrescricaoRequestInput, 'consultaId'>) => {
    try {
      await createMutation.mutateAsync(input);
      navigation.goBack();
    } catch {
      // Surfaced via createMutation.isError below.
    }
  };

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Nova Prescrição" />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          Carregando consulta...
        </Text>
      </View>
    );
  }

  if (!consulta || consulta.status !== 'FI') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title="Nova Prescrição" />
        <ScreenContainer>
          <EmptyState
            title="Ação indisponível"
            message="Prescrições só podem ser criadas para consultas finalizadas."
          />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Nova Prescrição" />
      <ScreenContainer>
        <PrescricaoForm
          patientName={consulta.animalNome}
          consultaLabel={toDisplayDate(consulta.dataHora.slice(0, 10))}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          errorMessage={
            createMutation.isError ? describePrescricaoError(createMutation.error) : undefined
          }
          submitLabel="Criar prescrição"
        />
      </ScreenContainer>
    </View>
  );
}
