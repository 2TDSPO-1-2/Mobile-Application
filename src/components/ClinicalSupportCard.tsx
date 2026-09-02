import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AppCard } from './AppCard';
import { useThemeColors } from '../hooks/useThemeColors';
import type { ClinicalSupportResponse } from '../services/consultaService';
import { spacing, fontSize } from '../styles/theme';

interface Props {
  support: ClinicalSupportResponse;
}

/**
 * Visually and semantically distinct from any future veterinarian
 * conclusion: everything on this card is explicitly labeled as AI-suggested
 * ("hipótese", "sugerida", "apoio"), never as a confirmed diagnosis. This
 * card must stay read-only — nothing here becomes editable into a
 * conclusion field without a deliberate, separate action from the
 * veterinarian (a later phase).
 */
export function ClinicalSupportCard({ support }: Props) {
  const colors = useThemeColors();

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.primary }]}>Apoio à decisão clínica</Text>
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        Hipótese gerada por inteligência artificial para apoiar a avaliação — não é o diagnóstico
        final. A decisão clínica é sempre do veterinário.
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Hipótese diagnóstica</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.hipoteseDiagnostica}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Severidade sugerida</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.severidadeSugerida}</Text>

      {support.confianca != null ? (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Confiança</Text>
          <Text style={[styles.value, { color: colors.text }]}>{support.confianca}%</Text>
        </>
      ) : null}

      <Text style={[styles.label, { color: colors.textSecondary }]}>Insight clínico da IA</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.insightClinico}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.xs },
  disclaimer: { fontSize: fontSize.xs, lineHeight: 17, marginBottom: spacing.sm },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: spacing.sm,
  },
  value: { fontSize: fontSize.sm, marginTop: 2 },
});
