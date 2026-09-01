import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList, SearchFilterType } from '../interfaces/navigation';
import { searchGlobal, type SearchItem } from '../services/searchService';
import { spacing, fontSize, radius } from '../styles/theme';

const FILTERS: Array<{ label: string; value: SearchFilterType }> = [
  { label: 'Todos', value: 'todos' },
  { label: 'Animais', value: 'animal' },
  { label: 'Veterinários', value: 'veterinario' },
  { label: 'Clínicas', value: 'clinica' },
  { label: 'Tutores', value: 'responsavel' },
];

function getTypeLabel(type: SearchItem['type']): string {
  switch (type) {
    case 'animal':
      return 'Animal';
    case 'veterinario':
      return 'Veterinário';
    case 'clinica':
      return 'Clínica';
    case 'responsavel':
      return 'Tutor';
    default:
      return 'Resultado';
  }
}

export function SearchScreen() {
  const colors = useThemeColors();
  const { role } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Pesquisa'>>();

  const [query, setQuery] = useState(route.params?.initialQuery ?? '');
  const [filter, setFilter] = useState<SearchFilterType>(
    route.params?.initialType ?? 'todos'
  );
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searched, setSearched] = useState(Boolean(route.params?.initialQuery));
  const [loading, setLoading] = useState(false);

  const visibleFilters = useMemo(() => {
    if (role === 'tutor') {
      return FILTERS.filter((item) => item.value !== 'responsavel');
    }

    return FILTERS;
  }, [role]);

  const runSearch = useCallback(
    async (term = query, selectedFilter = filter) => {
      const trimmed = term.trim();

      setSearched(true);

      if (!trimmed) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const apiType = selectedFilter === 'todos' ? undefined : selectedFilter;
        const found = await searchGlobal(trimmed, apiType);

        const safeResults = found
          .filter((item) => (role === 'tutor' ? item.type !== 'responsavel' : true))
          .map((item) => ({
            ...item,
            subtitle:
              item.type === 'responsavel'
                ? 'Tutor ArkIve'
                : item.type === 'clinica'
                  ? 'Clínica veterinária'
                  : item.subtitle,
          }))
          .sort((a, b) => a.title.localeCompare(b.title));

        setResults(safeResults);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query, filter, role]
  );

  useEffect(() => {
    if (route.params?.initialQuery) {
      runSearch(route.params.initialQuery, route.params.initialType ?? 'todos');
    }
  }, [route.params?.initialQuery, route.params?.initialType, runSearch]);

  const handleFilterChange = (nextFilter: SearchFilterType) => {
    setFilter(nextFilter);

    if (query.trim()) {
      runSearch(query, nextFilter);
    }
  };

  const handleResultPress = (item: SearchItem) => {
    if (item.type === 'animal') {
      navigation.navigate('AcompanhamentoAnimal', { animalId: item.id });
      return;
    }

    navigation.navigate('Perfil');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Pesquisa" />

      <ScreenContainer>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => runSearch()}
          placeholder="Pesquisar no ArkIve..."
        />

        <View style={styles.filters}>
          {visibleFilters.map((item) => {
            const active = filter === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => handleFilterChange(item.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? '#FFF' : colors.text,
                    fontWeight: active ? '700' : '500',
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppCard onPress={() => runSearch()}>
          <Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>
            {loading ? 'Buscando...' : 'Buscar'}
          </Text>
        </AppCard>

        {searched && results.length === 0 ? (
          <EmptyState
            title="Nenhum resultado"
            message="Tente outro termo ou verifique a conexão."
          />
        ) : (
          results.map((item) => (
            <AppCard key={`${item.type}-${item.id}`} onPress={() => handleResultPress(item)}>
              <Text style={{ color: colors.primary, fontSize: fontSize.xs }}>
                {getTypeLabel(item.type)}
              </Text>

              <Text style={[styles.title, { color: colors.text }]}>
                {item.title}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                {item.subtitle}
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});