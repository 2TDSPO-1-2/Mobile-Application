import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { useConsultas } from '../hooks/useConsultas';
import { consultaStatusPresentation } from '../utils/statusPresentation';
import { commonStyles } from '../styles/common';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

/**
 * Real veterinarian consultation list — GET /api/consultas via TanStack
 * Query, no mock fallback. A failed request renders a real error state; an
 * empty response renders a real empty state.
 */
export function ConsultasScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data, isPending, isError, error, refetch, isRefetching } = useConsultas();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('consultasList.title')}</Text>

        {isPending ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            {t('consultasList.loading')}
          </Text>
        ) : isError ? (
          <EmptyState
            title={t('consultasList.loadErrorTitle')}
            message={error instanceof Error ? error.message : t('consultasList.genericServerError')}
          />
        ) : data && data.length > 0 ? (
          data
            .slice()
            .sort((a, b) => b.id - a.id)
            .map((consulta) => (
              <AppCard
                key={consulta.id}
                onPress={() =>
                  navigation.navigate('ConsultaDetalhe', { consultaId: consulta.id })
                }
              >
                <View style={styles.cardRow}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {consulta.animalNome}
                  </Text>
                  <StatusBadge
                    label={consulta.statusDescricao}
                    tone={consultaStatusPresentation(consulta.status).tone}
                  />
                </View>
                <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                  {consulta.motivo}
                </Text>
              </AppCard>
            ))
        ) : (
          <EmptyState title={t('consultasList.emptyTitle')} message={t('consultasList.emptyMessage')} />
        )}

        <Pressable
          style={[commonStyles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CriarConsulta')}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </ScreenContainer>

      {!isPending && !isError ? (
        <Pressable style={styles.refreshHint} onPress={() => refetch()} disabled={isRefetching}>
          <Text style={{ color: colors.primary, fontSize: fontSize.xs }}>
            {isRefetching ? t('consultasList.refreshing') : t('consultasList.refresh')}
          </Text>
        </Pressable>
      ) : null}
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '300' },
  refreshHint: { alignSelf: 'center', marginBottom: spacing.md },
});
