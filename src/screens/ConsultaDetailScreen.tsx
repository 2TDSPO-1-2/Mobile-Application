import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { ClinicalNarrativeEditor, type NarrativeStatusTone } from '../components/ClinicalNarrativeEditor';
import { ClinicalSupportCard } from '../components/ClinicalSupportCard';
import { VeterinarianConclusionForm } from '../components/VeterinarianConclusionForm';
import { ConfirmedDiagnosisCard } from '../components/ConfirmedDiagnosisCard';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  useConsulta,
  useConsultaClinicalSupport,
  useDeleteConsulta,
  useFinalizeConsulta,
  useStartConsulta,
} from '../hooks/useConsultas';
import { useConsultaWorkflow } from '../hooks/useConsultaWorkflow';
import { useConsultaDiagnosticos } from '../hooks/useDiagnosticos';
import { findConfirmedDiagnosis } from '../services/diagnosticoService';
import type { FinalizarConsultaRequest } from '../services/consultaService';
import { consultaStatusPresentation } from '../utils/statusPresentation';
import {
  describeClinicalSupportError,
  describeFinalizeError,
  describeNarrativeSaveError,
} from '../utils/errorMessages';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

function formatDataHora(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

export function ConsultaDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'ConsultaDetalhe'>>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { data: consulta, isPending, isError, error, refetch } = useConsulta(consultaId);
  const startMutation = useStartConsulta(consultaId);
  const deleteMutation = useDeleteConsulta();
  const finalizeMutation = useFinalizeConsulta(consultaId);
  const { saveNarrativa, requestSupport, requestClinicalSupportFromDraft } =
    useConsultaWorkflow(consultaId);

  const supportEnabled = consulta?.status === 'AP' || consulta?.status === 'FI';
  const clinicalSupport = useConsultaClinicalSupport(consultaId, { enabled: supportEnabled });

  const diagnosticosEnabled = consulta?.status === 'FI';
  const diagnosticos = useConsultaDiagnosticos(consultaId, { enabled: diagnosticosEnabled });
  const confirmedDiagnosis = diagnosticos.data ? findConfirmedDiagnosis(diagnosticos.data) : undefined;

  const [actionError, setActionError] = useState('');

  // Initialize the draft from the persisted narrative exactly once per
  // consultation — never on every background refetch, so an in-progress
  // background query never clobbers what the veterinarian is typing.
  const [draft, setDraft] = useState('');
  const initializedForId = useRef<number | null>(null);
  if (consulta && initializedForId.current !== consulta.id) {
    initializedForId.current = consulta.id;
    setDraft(consulta.transcricao ?? '');
  }

  const handleChangeDraft = (text: string) => {
    setDraft(text);
    if (saveNarrativa.isError) {
      saveNarrativa.reset();
    }
  };

  const savedBaseline = saveNarrativa.data?.transcricao ?? consulta?.transcricao ?? '';
  const dirty = draft !== savedBaseline;

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

  const handleSaveNarrativa = () => {
    saveNarrativa.mutate(draft);
  };

  const handleRequestSupport = async () => {
    try {
      await requestClinicalSupportFromDraft(draft);
    } catch {
      // Surfaced via saveNarrativa.isError / requestSupport.isError below — nothing else to do here.
    }
  };

  const handleFinalize = async (input: FinalizarConsultaRequest) => {
    try {
      await finalizeMutation.mutateAsync(input);
    } catch {
      // Surfaced via finalizeMutation.isError below.
    }
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

  const canStart = consulta.status === 'AG';
  const canDelete = consulta.status === 'AG';
  const isEmProgresso = consulta.status === 'EP';
  const isAguardandoParecer = consulta.status === 'AP';
  const isFinalizada = consulta.status === 'FI';

  let narrativeStatusLabel: string | undefined;
  let narrativeStatusTone: NarrativeStatusTone = 'neutral';
  let narrativeErrorMessage: string | undefined;

  if (saveNarrativa.isPending) {
    narrativeStatusLabel = 'Salvando...';
    narrativeStatusTone = 'saving';
  } else if (saveNarrativa.isError) {
    narrativeErrorMessage = describeNarrativeSaveError(saveNarrativa.error);
  } else if (dirty) {
    narrativeStatusLabel = 'Alterações não salvas';
  } else if (saveNarrativa.isSuccess) {
    narrativeStatusLabel = 'Narrativa salva';
    narrativeStatusTone = 'saved';
  }

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
            Veterinário: {consulta.veterinarioNome}
          </Text>
          <Text style={[styles.field, { color: colors.textSecondary }]}>
            {consulta.modalidade === 'PRESENCIAL' ? 'Presencial' : 'Remota'} ·{' '}
            {formatDataHora(consulta.dataHora)}
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

        {isEmProgresso ? (
          <>
            <ClinicalNarrativeEditor
              value={draft}
              onChangeText={handleChangeDraft}
              editable={!requestSupport.isPending}
              statusLabel={narrativeStatusLabel}
              statusTone={narrativeStatusTone}
              errorMessage={narrativeErrorMessage}
            />

            <AppButton
              title="Salvar"
              variant="outline"
              onPress={handleSaveNarrativa}
              loading={saveNarrativa.isPending}
              disabled={!dirty || saveNarrativa.isPending || requestSupport.isPending}
            />

            {requestSupport.isPending ? (
              <AppCard>
                <Text style={{ color: colors.text, fontWeight: '700', marginBottom: spacing.xs }}>
                  Analisando o caso clínico...
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  A análise pode levar alguns instantes.
                </Text>
              </AppCard>
            ) : (
              <>
                {requestSupport.isError ? (
                  <>
                    <Text style={{ color: colors.error, marginBottom: spacing.sm }}>
                      {describeClinicalSupportError(requestSupport.error)}
                    </Text>
                    <AppButton
                      title="Verificar se já foi processado"
                      variant="outline"
                      onPress={() => refetch()}
                    />
                  </>
                ) : null}

                <AppButton
                  title="Solicitar apoio clínico"
                  onPress={handleRequestSupport}
                  disabled={!draft.trim() || saveNarrativa.isPending}
                />
              </>
            )}
          </>
        ) : null}

        {(isAguardandoParecer || isFinalizada) && consulta.transcricao ? (
          <AppCard>
            <Text style={[styles.label, { color: colors.text }]}>Narrativa clínica</Text>
            <Text style={[styles.field, { color: colors.text }]}>{consulta.transcricao}</Text>
          </AppCard>
        ) : null}

        {isAguardandoParecer ? (
          <>
            {clinicalSupport.isPending ? (
              <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
                Carregando apoio clínico...
              </Text>
            ) : clinicalSupport.isError ? (
              <EmptyState
                title="Não foi possível carregar o apoio clínico"
                message="Tente novamente em instantes."
              />
            ) : clinicalSupport.data ? (
              <ClinicalSupportCard support={clinicalSupport.data} />
            ) : null}

            <VeterinarianConclusionForm
              onSubmit={handleFinalize}
              isSubmitting={finalizeMutation.isPending}
              errorMessage={
                finalizeMutation.isError ? describeFinalizeError(finalizeMutation.error) : undefined
              }
            />
          </>
        ) : null}

        {isFinalizada ? (
          <>
            {clinicalSupport.data ? <ClinicalSupportCard support={clinicalSupport.data} /> : null}

            {diagnosticos.isPending ? (
              <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
                Carregando conclusão do veterinário...
              </Text>
            ) : confirmedDiagnosis ? (
              <ConfirmedDiagnosisCard diagnosis={confirmedDiagnosis} conclusao={consulta.observacao} />
            ) : null}

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
