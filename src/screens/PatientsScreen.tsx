import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTranslation } from '../i18n/useTranslation';
import { usePatients, useMyPatients } from '../hooks/usePatients';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize, radius } from '../styles/theme';

type Scope = 'clinica' | 'atendidos';

/**
 * Two legitimate scopes now that Animal isn't veterinarian-owned:
 * "Da clínica" (GET /api/animais/clinica — the real clinic patient
 * registry, no prior consultation required) and "Já atendidos"
 * (GET /api/animais — this veterinarian's own consultation history).
 * Defaults to "Da clínica" since that's the actual clinic registry; the
 * segmented toggle keeps the old "já atendidos" view one tap away instead
 * of dropping it.
 */
export function PatientsScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [scope, setScope] = useState<Scope>('clinica');
  const [search, setSearch] = useState('');

  const clinicQuery = useMyPatients(undefined, { enabled: scope === 'clinica' });
  const attendedQuery = usePatients();
  const { data, isPending, isError, error } = scope === 'clinica' ? clinicQuery : attendedQuery;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !data) return data ?? [];
    return data.filter(
      (animal) =>
        animal.nome.toLowerCase().includes(q) ||
        animal.especieNome.toLowerCase().includes(q) ||
        (animal.racaNome?.toLowerCase().includes(q) ?? false)
    );
  }, [data, search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('patientsList.title')}</Text>

        <View style={[styles.segmented, { borderColor: colors.border }]}>
          <Pressable
            style={[styles.segment, scope === 'clinica' && { backgroundColor: colors.primary }]}
            onPress={() => setScope('clinica')}
          >
            <Text style={{ color: scope === 'clinica' ? '#FFF' : colors.text, fontSize: fontSize.sm }}>
              {t('patientsList.clinicScope')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segment, scope === 'atendidos' && { backgroundColor: colors.primary }]}
            onPress={() => setScope('atendidos')}
          >
            <Text style={{ color: scope === 'atendidos' ? '#FFF' : colors.text, fontSize: fontSize.sm }}>
              {t('patientsList.attendedScope')}
            </Text>
          </Pressable>
        </View>

        <SearchBar value={search} onChangeText={setSearch} placeholder={t('patientsList.searchPlaceholder')} />

        {isPending ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            {t('patientsList.loading')}
          </Text>
        ) : isError ? (
          <EmptyState
            title={t('patientsList.loadErrorTitle')}
            message={error instanceof Error ? error.message : t('patientsList.genericServerError')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('patientsList.emptyTitle')}
            message={scope === 'clinica' ? t('patientsList.emptyClinicMessage') : t('patientsList.emptyAttendedMessage')}
          />
        ) : (
          filtered.map((animal) => (
            <AppCard
              key={animal.id}
              onPress={() => navigation.navigate('PacienteDetalhe', { patientId: animal.id })}
            >
              <Text style={{ color: colors.text, fontWeight: '700' }}>{animal.nome}</Text>
              <Text style={{ color: colors.textSecondary }}>
                {animal.especieNome}
                {animal.racaNome ? ` · ${animal.racaNome}` : ''}
              </Text>
            </AppCard>
          ))
        )}
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
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
