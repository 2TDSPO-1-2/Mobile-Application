import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import { getAppointments, sortAppointments } from '../services/appointmentService';
import { getAnimalById } from '../services/animalService';
import { getUsers } from '../services/userService';
import type { Appointment } from '../types';
import { isToday } from '../utils/date';
import { spacing, fontSize } from '../styles/theme';

function getDisplayFirstName(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.replace(/\./g, '').toLowerCase();
  if (first === 'dr' || first === 'dra') return parts[1] ?? '';
  return parts[0] ?? '';
}

interface TodayItem {
  appointment: Appointment;
  animalName: string;
  veterinarianName: string;
}

export function HomeScreen() {
  const { user, role } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [search, setSearch] = useState('');
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);

  const load = useCallback(async () => {
    if (!user) return;

    const filters =
      role === 'tutor'
        ? { responsavelId: user.responsavelId }
        : { veterinarianId: user.veterinarioId };

    const appointments = sortAppointments(await getAppointments(filters));
    const users = await getUsers();

    const todayAppointments = appointments.filter(
      (appointment) =>
        isToday(appointment.date) &&
        appointment.status !== 'cancelada' &&
        appointment.status !== 'realizada'
    );

    const enriched: TodayItem[] = [];

    for (const appointment of todayAppointments) {
      const animal = await getAnimalById(appointment.animalId);
      const vet = users.find(
        (item) =>
          item.role === 'veterinario' &&
          String(item.veterinarioId) === String(appointment.veterinarianId)
      );

      enriched.push({
        appointment,
        animalName: animal?.name ?? 'Animal',
        veterinarianName: vet?.name ?? 'Veterinário',
      });
    }

    setTodayItems(enriched);
  }, [user, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const firstName = getDisplayFirstName(user?.name);
  const greeting =
    role === 'veterinario' ? `Olá, Dr. ${firstName}!` : `Olá, ${firstName}!`;

  const orderedToday = useMemo(
    () =>
      [...todayItems].sort((a, b) =>
        a.appointment.time.localeCompare(b.appointment.time)
      ),
    [todayItems]
  );

  const handleSearch = () => {
    const term = search.trim();
    navigation.navigate('Pesquisa', term ? { initialQuery: term } : undefined);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer scroll={false} style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={handleSearch}
          placeholder="Buscar animais, veterinários ou clínicas..."
        />

        <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Acompanhe seus compromissos veterinários e registros do ArkIve.
        </Text>

        <AppCard>
          <Text style={[styles.section, { color: colors.text }]}>
            Consultas marcadas para hoje: {orderedToday.length}
          </Text>

          {orderedToday.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              Sem consultas marcadas para hoje.
            </Text>
          ) : (
            orderedToday.map(({ appointment, animalName, veterinarianName }) => (
              <View key={appointment.id} style={[styles.todayCard, { borderColor: colors.border }]}>
                <Text style={[styles.todayTitle, { color: colors.text }]}>
                  {animalName}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {veterinarianName} · {appointment.time}
                </Text>
                {appointment.notes ? (
                  <Text style={{ color: colors.textSecondary }}>
                    {appointment.notes}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </AppCard>

        <Text style={[styles.section, { color: colors.text }]}>Acesso rápido</Text>

        <AppButton
          title="Marcar consulta"
          variant="outline"
          onPress={() => navigation.navigate('NovaConsulta', {})}
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
  content: { flex: 1, padding: spacing.md },
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
  section: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  todayCard: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  todayTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
