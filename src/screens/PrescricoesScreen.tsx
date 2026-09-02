import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsulta } from '../hooks/useConsultas';
import { usePrescricoesByConsulta } from '../hooks/usePrescricoes';
import { toDisplayDate } from '../utils/isoDate';
import { commonStyles } from '../styles/common';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

/** Real prescription list — GET /api/prescricoes?consultaId=X via TanStack Query, no mock fallback. */
export function PrescricoesScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'Prescricoes'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { data: consulta } = useConsulta(consultaId);
  const { data, isPending, isError, error } = usePrescricoesByConsulta(consultaId);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Prescrições" />

      <ScreenContainer>
        {consulta ? (
          <Text style={[styles.context, { color: colors.textSecondary }]}>
            {consulta.animalNome} · {toDisplayDate(consulta.dataHora.slice(0, 10))}
          </Text>
        ) : null}

        {isPending ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Carregando prescrições...
          </Text>
        ) : isError ? (
          <EmptyState
            title="Não foi possível carregar"
            message={error instanceof Error ? error.message : 'Erro ao consultar o servidor.'}
          />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Nenhuma prescrição"
            message="Nenhuma prescrição registrada para esta consulta."
          />
        ) : (
          data.map((prescricao) => (
            <AppCard
              key={prescricao.id}
              onPress={() =>
                navigation.navigate('PrescricaoDetalhe', { prescricaoId: prescricao.id, consultaId })
              }
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>{prescricao.medicamento}</Text>
              <Text style={{ color: colors.textSecondary }}>
                {prescricao.dosagem}
                {prescricao.frequencia ? ` · ${prescricao.frequencia}` : ''}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                {toDisplayDate(prescricao.dataInicio)}
                {prescricao.dataFim ? ` – ${toDisplayDate(prescricao.dataFim)}` : ''}
              </Text>
            </AppCard>
          ))
        )}

        <Pressable
          style={[commonStyles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('NovaPrescricao', { consultaId })}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  context: { fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '300' },
});
