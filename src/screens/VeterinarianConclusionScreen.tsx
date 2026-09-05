import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { VeterinarianConclusionForm } from '../components/VeterinarianConclusionForm';
import { useThemeColors } from '../hooks/useThemeColors';
import { useFinalizeConsulta } from '../hooks/useConsultas';
import { getConsulta } from '../services/consultaService';
import { isTransientInfraError } from '../services/apiClient';
import { describeFinalizeError } from '../utils/errorMessages';
import { queryKeys } from '../query/queryKeys';
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
  const queryClient = useQueryClient();
  const { consultaId } = route.params;

  const finalizeMutation = useFinalizeConsulta(consultaId);

  // Removes AnaliseArkive/InsightArkive/ConclusaoVeterinaria from the stack
  // in one step — ConsultaDetalhe is already sitting underneath (it's how
  // the veterinarian got here), so this is a pop, not a fresh push. That
  // also means Back from the finalized detail never reopens this form or
  // the stale AI-result screen.
  const goToFinalizedDetail = () => {
    navigation.popTo('ConsultaDetalhe', { consultaId });
  };

  const handleSubmit = async (input: FinalizarConsultaRequest) => {
    try {
      await finalizeMutation.mutateAsync(input);
      goToFinalizedDetail();
      return;
    } catch (err) {
      // A deterministic rejection (400/403/404/409/422) means the server
      // told us plainly what happened — no guessing needed, let the mapped
      // error render via finalizeMutation.isError below. Only a genuinely
      // uncertain outcome (the HTTP response itself was lost) is worth a
      // recovery check.
      if (!isTransientInfraError(err)) return;

      // The finalize call may have actually committed server-side even
      // though we never saw its response — check real server state instead
      // of assuming failure. This is a read-only GET, never a repeated
      // POST /finalizar (that would risk a duplicate workflow action).
      try {
        const consulta = await getConsulta(consultaId);
        if (consulta.status === 'FI') {
          queryClient.setQueryData(queryKeys.consultas.detail(consultaId), consulta);
          goToFinalizedDetail();
        }
        // Anything other than FI: it genuinely didn't commit — fall through
        // to the mapped error below.
      } catch {
        // Recovery check itself failed — fall through to the mapped error.
      }
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Conclusão do veterinário" />
      <ScreenContainer style={styles.content}>
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
  // Scoped to this screen only (passed as ScreenContainer's own `style`
  // prop, not a change to the shared component/commonStyles.content) — lets
  // a short form center in the available height instead of sitting packed
  // at the top with dead space below, while `flexGrow: 1` (not a fixed
  // height) still lets the ScrollView grow and scroll normally once the
  // keyboard or a long conclusion pushes content past one screen.
  content: { flexGrow: 1, justifyContent: 'center' },
});
