import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import { usePatients } from '../hooks/usePatients';
import { spacing, fontSize } from '../styles/theme';

/**
 * Real, read-only patient list — GET /api/animais, scoped server-side to the
 * authenticated veterinarian's own patients (confirmed against the Spring
 * source; see patientService.ts). No create/edit/delete here: the backend
 * itself restricts animal administration to ADMIN_CLINICA/SYSADMIN.
 */
export function PatientsScreen() {
  const colors = useThemeColors();
  const { data, isPending, isError, error } = usePatients();
  const [search, setSearch] = useState('');

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
        <Text style={[styles.pageTitle, { color: colors.text }]}>Pacientes</Text>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar paciente..." />

        {isPending ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Carregando pacientes...
          </Text>
        ) : isError ? (
          <EmptyState
            title="Não foi possível carregar"
            message={error instanceof Error ? error.message : 'Erro ao consultar o servidor.'}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum paciente encontrado"
            message="Pacientes vinculados às suas consultas aparecerão aqui."
          />
        ) : (
          filtered.map((animal) => (
            <AppCard key={animal.id}>
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
});
