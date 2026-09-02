import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsultas } from '../hooks/useConsultas';
import { spacing, fontSize } from '../styles/theme';

/**
 * Deliberately minimal: this screen exists to prove the real Spring Boot +
 * TanStack Query pipeline end-to-end (query hook -> service -> apiClient ->
 * GET /api/consultas -> real response), not to deliver the consultation
 * feature. No patient names, no detail view, no actions — that's the next
 * phase. No mock fallback: a failed request renders a real error, never
 * substitute data.
 */
export function ConsultasScreen() {
  const colors = useThemeColors();
  const { data, isPending, isError, error, refetch, isRefetching } = useConsultas();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Consultas</Text>

        {isPending ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Carregando consultas...
          </Text>
        ) : isError ? (
          <EmptyState
            title="Não foi possível carregar"
            message={
              error instanceof Error ? error.message : 'Erro ao consultar o servidor.'
            }
          />
        ) : data && data.length > 0 ? (
          data.map((consulta) => (
            <AppCard key={consulta.id}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                Consulta #{consulta.id}
              </Text>
              <Text style={{ color: colors.textSecondary }}>Status: {consulta.status}</Text>
            </AppCard>
          ))
        ) : (
          <EmptyState
            title="Nenhuma consulta"
            message="A API não retornou nenhuma consulta para este usuário."
          />
        )}

        <AppButton
          title="Atualizar"
          variant="outline"
          onPress={() => refetch()}
          loading={isRefetching}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
