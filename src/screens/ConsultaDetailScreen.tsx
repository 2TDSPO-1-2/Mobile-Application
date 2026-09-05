import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ClinicalIntake } from '../components/ClinicalIntake';
import { ClinicalSupportCard } from '../components/ClinicalSupportCard';
import { ConfirmedDiagnosisCard } from '../components/ConfirmedDiagnosisCard';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  useConsulta,
  useConsultaClinicalSupport,
  useDeleteConsulta,
  useSaveNarrativa,
  useStartConsulta,
} from '../hooks/useConsultas';
import { useConsultaDiagnosticos } from '../hooks/useDiagnosticos';
import { findConfirmedDiagnosis } from '../services/diagnosticoService';
import { consultaStatusPresentation } from '../utils/statusPresentation';
import { describeNarrativeSaveError } from '../utils/errorMessages';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

function formatContextLine(dataHora: string, modalidade: string): string {
  const date = new Date(dataHora);
  if (Number.isNaN(date.getTime())) return modalidade === 'PRESENCIAL' ? 'Presencial' : 'Remota';
  const dateLabel = date.toLocaleDateString('pt-BR');
  const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const modalidadeLabel = modalidade === 'PRESENCIAL' ? 'Presencial' : 'Remota';
  return `${modalidadeLabel} · ${dateLabel} · ${timeLabel}`;
}

/**
 * Status router for a consultation:
 * - AG/CA/FI keep the existing card-based read/action layout.
 * - EP renders the dedicated ArkIve clinical intake experience
 *   (`ClinicalIntake`) — no separate Save step; "Analisar com ArkIve"
 *   persists the narrative, then (only on success) navigates to the
 *   dedicated analysis screen, which owns generation/recovery independently.
 * - AP redirects immediately to the dedicated insight screen — reopening a
 *   consultation already awaiting the vet's review should never show a
 *   recording screen again.
 */
export function ConsultaDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ConsultaDetalhe'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { data: consulta, isPending, isError, error, refetch } = useConsulta(consultaId);
  const startMutation = useStartConsulta(consultaId);
  const deleteMutation = useDeleteConsulta();
  const saveNarrativa = useSaveNarrativa(consultaId);

  const diagnosticosEnabled = consulta?.status === 'FI';
  const diagnosticos = useConsultaDiagnosticos(consultaId, { enabled: diagnosticosEnabled });
  const confirmedDiagnosis = diagnosticos.data ? findConfirmedDiagnosis(diagnosticos.data) : undefined;
  const clinicalSupport = useConsultaClinicalSupport(consultaId, { enabled: consulta?.status === 'FI' });

  const [actionError, setActionError] = useState('');

  // AP means the veterinarian already asked ArkIve to analyze this case —
  // reopening it should land on the insight screen, never back on an EP-shaped
  // recording UI.
  useEffect(() => {
    if (consulta?.status === 'AP') {
      navigation.replace('InsightArkive', { consultaId });
    }
  }, [consulta?.status, consultaId, navigation]);

  const handleStart = async () => {
    setActionError('');
    try {
      await startMutation.mutateAsync();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível iniciar a consulta.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir consulta',
      `Tem certeza que deseja excluir a consulta #${consultaId}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setActionError('');
            try {
              await deleteMutation.mutateAsync(consultaId);
              navigation.goBack();
            } catch (err) {
              setActionError(
                err instanceof Error ? err.message : 'Não foi possível excluir a consulta.'
              );
            }
          },
        },
      ]
    );
  };

  // The critical invariant: PATCH narrativa must complete successfully
  // BEFORE navigating to the analysis screen (which is the only place that
  // ever calls POST suporte-clinico). If the save rejects, this throws and
  // ClinicalIntake shows the error inline — no navigation, no AI call.
  const handleAnalyze = async (narrativa: string) => {
    try {
      await saveNarrativa.mutateAsync(narrativa);
    } catch (err) {
      throw new Error(describeNarrativeSaveError(err));
    }
    navigation.navigate('AnaliseArkive', { consultaId });
  };

  if (isPending) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Consulta" />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          Carregando consulta...
        </Text>
      </View>
    );
  }

  if (isError || !consulta) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Consulta" />
        <ScreenContainer>
          <EmptyState
            title="Não foi possível carregar"
            message={error instanceof Error ? error.message : 'Consulta não encontrada.'}
          />
          <AppButton title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </ScreenContainer>
      </View>
    );
  }

  // EP: the dedicated clinical intake experience — no status card, no
  // Salvar button, no voice-language chips.
  if (consulta.status === 'EP') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title={`Consulta #${consulta.id}`} />
        <ScreenContainer>
          <ClinicalIntake
            animalNome={consulta.animalNome}
            contextLine={formatContextLine(consulta.dataHora, consulta.modalidade)}
            motivo={consulta.motivo}
            initialNarrativa={consulta.transcricao ?? ''}
            onAnalyze={handleAnalyze}
            analyzing={saveNarrativa.isPending}
          />
        </ScreenContainer>
      </View>
    );
  }

  // AP redirects (see the effect above) — render nothing while that happens.
  if (consulta.status === 'AP') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title={`Consulta #${consulta.id}`} />
      </View>
    );
  }

  const canStart = consulta.status === 'AG';
  const canDelete = consulta.status === 'AG';
  const isFinalizada = consulta.status === 'FI';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={`Consulta #${consulta.id}`} />

      <ScreenContainer>
        <AppCard>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Status</Text>
            <StatusBadge
              label={consulta.statusDescricao}
              tone={consultaStatusPresentation(consulta.status).tone}
            />
          </View>

          <Text style={[styles.field, { color: colors.text }]}>Paciente: {consulta.animalNome}</Text>
          <Text style={[styles.field, { color: colors.textSecondary }]}>
            {consulta.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Remota'} ·{' '}
            {new Date(consulta.dataHora).toLocaleString('pt-BR')}
          </Text>

          {consulta.motivo ? (
            <Text style={[styles.field, { color: colors.text }]}>Motivo: {consulta.motivo}</Text>
          ) : null}

          {consulta.sintomas ? (
            <Text style={[styles.field, { color: colors.textSecondary }]}>
              Sintomas: {consulta.sintomas}
            </Text>
          ) : null}

          {consulta.peso != null ? (
            <Text style={[styles.field, { color: colors.textSecondary }]}>
              Peso: {consulta.peso} kg
            </Text>
          ) : null}
        </AppCard>

        {isFinalizada ? (
          <>
            {consulta.transcricao ? (
              <AppCard>
                <Text style={[styles.label, { color: colors.text }]}>Narrativa clínica</Text>
                <Text style={[styles.field, { color: colors.text }]}>{consulta.transcricao}</Text>
              </AppCard>
            ) : null}

            {clinicalSupport.data ? <ClinicalSupportCard support={clinicalSupport.data} /> : null}

            {diagnosticos.isPending ? (
              <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
                Carregando conclusão do veterinário...
              </Text>
            ) : confirmedDiagnosis ? (
              <ConfirmedDiagnosisCard diagnosis={confirmedDiagnosis} conclusao={consulta.observacao} />
            ) : null}

            <AppButton
              title="Prescrições"
              variant="outline"
              onPress={() => navigation.navigate('Prescricoes', { consultaId: consulta.id })}
            />

            <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
              Consulta encerrada — registro somente leitura.
            </Text>
          </>
        ) : null}

        {consulta.status === 'CA' ? (
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Consulta encerrada — registro somente leitura.
          </Text>
        ) : null}

        {actionError ? (
          <Text style={{ color: colors.error, marginBottom: spacing.sm }}>{actionError}</Text>
        ) : null}

        {canStart ? (
          <AppButton title="Iniciar consulta" onPress={handleStart} loading={startMutation.isPending} />
        ) : null}

        {canDelete ? (
          <AppButton
            title="Excluir consulta"
            variant="danger"
            onPress={handleDelete}
            loading={deleteMutation.isPending}
          />
        ) : null}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { fontSize: fontSize.md, fontWeight: '700' },
  field: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
