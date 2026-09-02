import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsulta, useDeleteConsulta, useStartConsulta } from '../hooks/useConsultas';
import { consultaStatusPresentation } from '../utils/statusPresentation';
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

  const [actionError, setActionError] = useState('');

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
  // Backend-confirmed rule (ConsultaService.excluir): only AG can be deleted; anything else returns 409.
  const canDelete = consulta.status === 'AG';

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

        {consulta.status === 'EP' ? (
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Consulta em progresso. Registro de narrativa clínica e apoio de IA chegam em uma
            próxima etapa.
          </Text>
        ) : null}

        {consulta.status === 'AP' ? (
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
            Aguardando parecer — a revisão do apoio de IA e a conclusão do veterinário ainda não
            estão disponíveis neste aplicativo.
          </Text>
        ) : null}

        {consulta.status === 'FI' || consulta.status === 'CA' ? (
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
