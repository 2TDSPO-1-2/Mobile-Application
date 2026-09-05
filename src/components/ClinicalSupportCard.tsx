import React from 'react';
import { Text, View, Pressable, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from './AppCard';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import type { ClinicalSupportResponse } from '../services/consultaService';
import { parseSourceUrl } from '../utils/sourceUrl';
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
  const { t } = useTranslation();
  // Normalized, never derived from `confianca` — whether external research
  // happened is entirely the clinical engine's call, not something this
  // component infers from another field. Optional on the type because a
  // currently-deployed backend may predate this field (V4).
  const fontes = support.fontesPesquisadas ?? [];

  return (
    <AppCard>
      <Text style={[styles.title, { color: colors.primary }]}>{t('clinicalSupportCard.title')}</Text>
      <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
        {t('clinicalSupportCard.disclaimer')}
      </Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('clinicalSupportCard.hypothesis')}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.hipoteseDiagnostica}</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('clinicalSupportCard.severity')}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.severidadeSugerida}</Text>

      {support.confianca != null ? (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('clinicalSupportCard.confidence')}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{support.confianca}%</Text>
        </>
      ) : null}

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('clinicalSupportCard.insight')}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{support.insightClinico}</Text>

      {fontes.length > 0 ? (
        <View style={styles.sourcesSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('clinicalSupportCard.sourcesTitle')}
          </Text>
          {fontes.map((fonte, index) => {
            const parsed = parseSourceUrl(fonte);
            if (parsed) {
              return (
                <Pressable
                  key={`${index}-${fonte}`}
                  onPress={() => {
                    Linking.openURL(parsed.url).catch(() => {
                      /* Nothing actionable client-side if the OS can't open it (no browser, malformed edge case). */
                    });
                  }}
                  accessibilityRole="link"
                  accessibilityLabel={parsed.url}
                  style={styles.sourceRow}
                >
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                  <Text style={[styles.sourceText, { color: colors.primary }]} numberOfLines={1}>
                    {parsed.hostname}
                  </Text>
                </Pressable>
              );
            }
            return (
              <View key={`${index}-${fonte}`} style={styles.sourceRow}>
                <Text style={[styles.sourceText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {fonte}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
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
  // Deliberately no card-per-source, no border, no background — a compact
  // vertical list stays visually secondary to the reasoning above it.
  sourcesSection: { marginTop: spacing.sm },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingVertical: spacing.xs,
  },
  sourceText: { fontSize: fontSize.sm, flexShrink: 1 },
});
