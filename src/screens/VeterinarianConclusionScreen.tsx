import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { VeterinarianConclusionForm } from '../components/VeterinarianConclusionForm';
import { useThemeColors } from '../hooks/useThemeColors';
import { useFinalizeConsulta } from '../hooks/useConsultas';
import { describeFinalizeError } from '../utils/errorMessages';
import type { FinalizarConsultaRequest } from '../services/consultaService';
import type { AppStackParamList } from '../interfaces/navigation';

/**
 * Dedicated finalize-consultation screen (AP -> FI). Reuses
 * `VeterinarianConclusionForm` and `useFinalizeConsulta` completely
 * unchanged — this is purely a navigation-level extraction from
 * ConsultaDetailScreen, not a new finalize contract. The form itself never
 * receives AI-support data as a prop (confirmed in the component), so there
 * is no path for it to prefill diagnosis/severity from the ArkIve insight —
 * the veterinarian's conclusion stays an independent decision.
 */
export function VeterinarianConclusionScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ConclusaoVeterinaria'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const finalizeMutation = useFinalizeConsulta(consultaId);

  const handleSubmit = async (input: FinalizarConsultaRequest) => {
    try {
      await finalizeMutation.mutateAsync(input);
      navigation.replace('ConsultaDetalhe', { consultaId });
    } catch {
      // Surfaced via finalizeMutation.isError below.
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Conclusão do veterinário" />
      <ScreenContainer>
        <VeterinarianConclusionForm
          onSubmit={handleSubmit}
          isSubmitting={finalizeMutation.isPending}
          errorMessage={finalizeMutation.isError ? describeFinalizeError(finalizeMutation.error) : undefined}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
