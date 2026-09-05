import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppButton } from '../components/AppButton';
import { VoiceOrb } from '../components/VoiceOrb';
import { useThemeColors } from '../hooks/useThemeColors';
import { useClinicalSupportGeneration } from '../hooks/useClinicalSupportGeneration';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';

// Truthful, rotating status copy — never claims an action we can't prove
// (no "consultando N estudos"/"pesquisando artigos"/"validando diagnóstico").
// This screen's real job, besides informing the veterinarian, is to absorb
// the clinical engine's cold-start/retry window without it ever reading as
// a failure — recovery is persistent, so this keeps rotating for as long as
// it takes, not for a fixed number of attempts.
const MESSAGES = [
  'Organizando o relato clínico...',
  'Analisando as informações do caso...',
  'Preparando o apoio à decisão...',
];
const MESSAGE_INTERVAL_MS = 3500;

/**
 * Dedicated full-screen analysis experience. Generation/recovery is fully
 * owned by `useClinicalSupportGeneration` — this screen only starts it once
 * on mount and reacts to the resulting phase; it never touches the POST/GET
 * calls directly, so the cold-start recovery logic exists in exactly one
 * place. Reaching `error` phase here means a genuine non-transient failure
 * (permission/validation/not-found) — transient infrastructure failures
 * never leave `analyzing`, they just keep recovering silently.
 *
 * Back navigation stays available throughout: persistent retry is not the
 * same as trapping the veterinarian on this screen. Leaving simply lets the
 * hook's mount guard stop every local timer/loop — the server-side workflow
 * may keep processing independently.
 */
export function ArkiveAnalysisScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'AnaliseArkive'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const colors = useThemeColors();
  const { consultaId } = route.params;

  const { phase, errorMessage, isSlow, generate } = useClinicalSupportGeneration(consultaId);
  const [messageIndex, setMessageIndex] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    startedRef.current = true;
    generate();
    // Intentionally runs once on mount only — the hook itself owns every
    // subsequent retry/poll while a transient failure persists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (startedRef.current && phase === 'idle') {
      navigation.replace('InsightArkive', { consultaId });
    }
  }, [phase, consultaId, navigation]);

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Análise ArkIve" />

      <ScreenContainer>
        <View style={styles.center}>
          <VoiceOrb mode="analyzing" />

          {phase === 'error' ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Não foi possível concluir agora</Text>
              <Text style={[styles.message, { color: colors.error }]}>{errorMessage}</Text>

              <AppButton title="Tentar novamente" onPress={generate} style={styles.actionButton} />
              <AppButton
                title="Voltar ao relato"
                variant="outline"
                onPress={() => navigation.goBack()}
                style={styles.actionButton}
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Analisando o caso</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                ArkIve está preparando informações para apoiar sua avaliação.
              </Text>
              <Text style={[styles.rotating, { color: colors.primary }]}>{MESSAGES[messageIndex]}</Text>

              {isSlow ? (
                <Text style={[styles.slow, { color: colors.textSecondary }]}>
                  Está levando um pouco mais de tempo que o normal. Continuamos preparando sua análise.
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  rotating: { fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center', marginTop: spacing.lg },
  slow: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.lg, lineHeight: 20 },
  actionButton: { marginTop: spacing.md, alignSelf: 'stretch' },
});
