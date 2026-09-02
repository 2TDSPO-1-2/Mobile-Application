import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePrescricao, useDeletePrescricao } from '../hooks/usePrescricoes';
import { viaAdministracaoLabel } from '../utils/viaAdministracao';
import { toDisplayDate } from '../utils/isoDate';
import { describePrescricaoError } from '../utils/errorMessages';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

export function PrescricaoDetailScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'PrescricaoDetalhe'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { prescricaoId, consultaId } = route.params;

  const { data: prescricao, isPending, isError, error, refetch } = usePrescricao(
    prescricaoId,
    consultaId
  );
  const deleteMutation = useDeletePrescricao(consultaId);
  const [actionError, setActionError] = useState('');

  const handleDelete = () => {
    Alert.alert('Excluir prescrição', 'Esta ação não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setActionError('');
          try {
            await deleteMutation.mutateAsync(prescricaoId);
            navigation.goBack();
          } catch (err) {
            setActionError(describePrescricaoError(err));
          }
        },
      },
    ]);
  };

  if (isPending) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Prescrição" />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl }}>
          Carregando prescrição...
        </Text>
      </View>
    );
  }

  if (isError || !prescricao) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Prescrição" />
        <ScreenContainer>
          <EmptyState
            title="Não foi possível carregar"
            message={error instanceof Error ? error.message : 'Prescrição não encontrada.'}
          />
          <AppButton title="Tentar novamente" variant="outline" onPress={() => refetch()} />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Prescrição" />
      <ScreenContainer>
        <AppCard>
          <Text style={[styles.title, { color: colors.text }]}>{prescricao.medicamento}</Text>
          <Text style={[styles.field, { color: colors.text }]}>Dosagem: {prescricao.dosagem}</Text>
          {prescricao.frequencia ? (
            <Text style={[styles.field, { color: colors.textSecondary }]}>
              Frequência: {prescricao.frequencia}
            </Text>
          ) : null}
          <Text style={[styles.field, { color: colors.textSecondary }]}>
            Via de administração: {viaAdministracaoLabel(prescricao.viaAdministracao)}
          </Text>
          <Text style={[styles.field, { color: colors.textSecondary }]}>
            Início: {toDisplayDate(prescricao.dataInicio)}
            {prescricao.dataFim ? ` · Término: ${toDisplayDate(prescricao.dataFim)}` : ''}
          </Text>
          {prescricao.instrucoes ? (
            <Text style={[styles.field, { color: colors.text }]}>
              Instruções: {prescricao.instrucoes}
            </Text>
          ) : null}
        </AppCard>

        {actionError ? (
          <Text style={{ color: colors.error, marginBottom: spacing.sm }}>{actionError}</Text>
        ) : null}

        <AppButton
          title="Editar"
          variant="outline"
          onPress={() => navigation.navigate('EditarPrescricao', { prescricaoId, consultaId })}
        />

        <AppButton
          title="Excluir"
          variant="danger"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.xs },
  field: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
