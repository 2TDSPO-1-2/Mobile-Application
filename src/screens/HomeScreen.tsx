import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import { useConsultas } from '../hooks/useConsultas';
import { consultaStatusPresentation } from '../utils/statusPresentation';
import type { AppStackParamList } from '../interfaces/navigation';
import { spacing, fontSize } from '../styles/theme';
import { commonStyles } from '../styles/common';

function getDisplayFirstName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.replace(/\./g, '').toLowerCase();
  if (first === 'dr' || first === 'dra') return parts[1] ?? '';
  return parts[0] ?? '';
}

function isSameDayAsNow(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatHora(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function HomeScreen() {
  const { user, role } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [search, setSearch] = useState('');

  // GET /api/consultas — same TanStack Query cache ConsultasScreen already
  // populates, scoped server-side to the authenticated veterinarian. This
  // replaced a Node-era `/appointments` widget whose endpoint no longer
  // exists on the Spring backend and crashed every visit to this screen with
  // an unhandled promise rejection.
  const { data: consultas, isPending, isError } = useConsultas();

  const todayConsultas = useMemo(() => {
    if (!consultas) return [];
    return consultas
      .filter((c) => c.status !== 'CA' && isSameDayAsNow(c.dataHora))
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  }, [consultas]);

  const firstName = getDisplayFirstName(user?.name);
  const greeting =
    role === 'veterinario' ? `Olá, Dr. ${firstName}!` : `Olá, ${firstName}!`;

  const handleSearch = () => {
    const term = search.trim();
    navigation.navigate('Pesquisa', term ? { initialQuery: term } : undefined);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={handleSearch}
          placeholder="Buscar animais, veterinários ou clínicas..."
        />

        <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Acompanhe suas consultas veterinárias e registros do ArkIve.
        </Text>

        <Text style={[commonStyles.eyebrow, { color: colors.primary, marginBottom: spacing.sm }]}>
          Consultas de hoje
        </Text>

        <AppCard>
          {isPending ? (
            <Text style={{ color: colors.textSecondary }}>Carregando consultas...</Text>
          ) : isError ? (
            <Text style={{ color: colors.error }}>Não foi possível carregar suas consultas.</Text>
          ) : todayConsultas.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              Sem consultas marcadas para hoje.
            </Text>
          ) : (
            todayConsultas.map((consulta, index) => (
              <View
                key={consulta.id}
                style={[
                  styles.todayCard,
                  index === 0 && styles.todayCardFirst,
                  { borderColor: colors.border },
                ]}
              >
                <View style={commonStyles.rowBetween}>
                  <Text style={[styles.todayTitle, { color: colors.text }]}>
                    {consulta.animalNome}
                  </Text>
                  <StatusBadge
                    label={consulta.statusDescricao}
                    tone={consultaStatusPresentation(consulta.status).tone}
                  />
                </View>
                <Text style={{ color: colors.textSecondary }}>
                  {consulta.veterinarioNome} · {formatHora(consulta.dataHora)}
                </Text>
              </View>
            ))
          )}
        </AppCard>

        <Text style={[commonStyles.eyebrow, { color: colors.primary, marginBottom: spacing.sm, marginTop: spacing.md }]}>
          Acesso rápido
        </Text>

        <AppButton
          title="Nova consulta"
          variant="outline"
          onPress={() => navigation.navigate('CriarConsulta')}
        />

        <AppButton
          title="Avaliações de BEA"
          variant="outline"
          onPress={() => navigation.navigate('Avaliacoes')}
        />

        <AppButton
          title="Meus feedbacks"
          variant="outline"
          onPress={() => navigation.navigate('Feedback', {})}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  todayCard: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  todayCardFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  todayTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
