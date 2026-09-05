import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { ClinicalSupportCard } from '../components/ClinicalSupportCard';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsulta, useConsultaClinicalSupport } from '../hooks/useConsultas';
import { isTransientInfraError } from '../services/apiClient';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

/**
 * Reads the persisted result via the same safe `GET` the rest of the app
 * already uses (`useConsultaClinicalSupport`, TanStack-cached) rather than
 * receiving the generated support object through navigation params — this
 * is what makes a refresh/reopen always show the real persisted state.
 *
 * Reopening this screen can itself race a still-cold engine (e.g. the
 * analysis screen just confirmed support existed, but the very next GET on
 * remount hits a transient blip). For a transient failure this keeps
 * retrying the GET automatically and shows the same loading state, never
 * the hard "não foi possível carregar" card — that card is reserved for a
 * genuine non-transient failure (auth/not-found).
 */
export function ArkiveInsightScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'InsightArkive'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { data: consulta, isPending: consultaPending } = useConsulta(consultaId);
  const support = useConsultaClinicalSupport(consultaId, {
    enabled: true,
    // Transient (500/502/503/504/network): keep retrying forever with a
    // capped backoff — never surfaces as a failure. Non-transient
    // (401/403/404/422): stop immediately, that's a real error.
    retry: (_failureCount, error) => isTransientInfraError(error),
    retryDelay: (attempt) => Math.min(4000 + attempt * 2000, 10000),
  });
  const [showNarrative, setShowNarrative] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Apoio clínico" />

      <ScreenContainer>
        {consultaPending ? (
          <Text style={{ color: colors.textSecondary }}>Carregando consulta...</Text>
        ) : consulta ? (
          <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
            {consulta.animalNome}
          </Text>
        ) : null}

        <Text style={[commonStyles.eyebrow, { color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          Insight clínico da ArkIve
        </Text>

        {support.data ? (
          <ClinicalSupportCard support={support.data} />
        ) : support.isError && !isTransientInfraError(support.error) ? (
          <EmptyState
            title="Não foi possível carregar o apoio clínico"
            message="Tente novamente em instantes."
          />
        ) : (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginLeft: spacing.sm }}>
              Carregando apoio clínico...
            </Text>
          </View>
        )}

        {consulta?.transcricao ? (
          <Pressable onPress={() => setShowNarrative((current) => !current)} style={styles.collapseHeader}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Relato analisado</Text>
            <Ionicons
              name={showNarrative ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </Pressable>
        ) : null}

        {showNarrative && consulta?.transcricao ? (
          <AppCard>
            <Text style={{ color: colors.text }}>{consulta.transcricao}</Text>
          </AppCard>
        ) : null}

        {support.data ? (
          <AppButton
            title="Registrar minha conclusão"
            onPress={() => navigation.navigate('ConclusaoVeterinaria', { consultaId })}
            style={styles.conclusionButton}
          />
        ) : null}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  patientName: { fontSize: fontSize.lg, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  conclusionButton: { marginTop: spacing.lg },
});
