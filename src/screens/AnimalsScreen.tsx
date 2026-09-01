import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppCard } from '../components/AppCard';
import { HomeHeader } from '../components/HomeHeader';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import { getAnimalById, getAnimalsByTutor } from '../services/animalService';
import { getAppointments } from '../services/appointmentService';
import { commonStyles } from '../styles/common';
import { fontSize, spacing } from '../styles/theme';
import type { Animal } from '../types';

export function AnimalsScreen() {
  const { user, role } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');

  const loadTutorAnimals = useCallback(async () => {
    if (!user) return [];
    return getAnimalsByTutor(user.id, user.responsavelId);
  }, [user]);

  const loadVeterinarianPatients = useCallback(async () => {
    if (!user?.veterinarioId) return [];

    const appointments = await getAppointments({
      veterinarianId: user.veterinarioId,
    });

    const animalIds = Array.from(
      new Set(appointments.map((appointment) => appointment.animalId))
    );

    const patients = await Promise.all(
      animalIds.map((animalId) => getAnimalById(animalId))
    );

    return patients.filter(Boolean) as Animal[];
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;

    if (role === 'tutor') {
      setAnimals(await loadTutorAnimals());
    } else {
      setAnimals(await loadVeterinarianPatients());
    }
  }, [user, role, loadTutorAnimals, loadVeterinarianPatients]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return animals;

    return animals.filter(
      (animal) =>
        animal.name.toLowerCase().includes(q) ||
        animal.species.toLowerCase().includes(q) ||
        (animal.breed?.toLowerCase().includes(q) ?? false)
    );
  }, [animals, search]);

  const title = role === 'tutor' ? 'Meus Animais' : 'Meus Pacientes';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />
      <Text style={[styles.pageTitle, { color: colors.text }]}>{title}</Text>

      <ScreenContainer>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar animal..."
        />

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum animal encontrado"
            message={
              role === 'tutor'
                ? 'Cadastre seu primeiro animal.'
                : 'Nenhum paciente vinculado às suas consultas.'
            }
          />
        ) : (
          filtered.map((animal) => (
            <AppCard
              key={animal.id}
              onPress={() =>
                navigation.navigate('AcompanhamentoAnimal', { animalId: animal.id })
              }
            >
              <Text style={[styles.name, { color: colors.text }]}>
                {animal.name}
              </Text>

              <Text style={{ color: colors.textSecondary }}>
                {animal.species}
                {animal.breed ? ` · ${animal.breed}` : ''}
              </Text>

              {role === 'tutor' ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() =>
                      navigation.navigate('AtualizarAnimal', { animalId: animal.id })
                    }
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>
                      Editar
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </AppCard>
          ))
        )}

        {role === 'tutor' ? (
          <Pressable
            style={[commonStyles.fab, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NovoAnimal')}
          >
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        ) : null}
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
    marginVertical: spacing.md,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  actions: {
    marginTop: spacing.sm,
  },
  fabText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '300',
  },
});