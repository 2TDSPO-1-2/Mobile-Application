import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { StatusBadge } from '../components/StatusBadge';
import { appointmentStatusPresentation } from '../utils/statusPresentation';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import type { Animal, Appointment } from '../types';
import { getAnimalById } from '../services/animalService';
import { getAppointments, sortAppointments } from '../services/appointmentService';
import { getEvaluationByAppointment } from '../services/evaluationService';
import { spacing, fontSize } from '../styles/theme';

export function AnimalFollowUpScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'AcompanhamentoAnimal'>>();
  const colors = useThemeColors();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [evalMap, setEvalMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const a = await getAnimalById(route.params.animalId);
    setAnimal(a ?? null);
    const all = sortAppointments(await getAppointments());
    const related = all.filter((apt) => apt.animalId === route.params.animalId);
    setAppointments(related);
    const map: Record<string, boolean> = {};
    for (const apt of related) {
      map[apt.id] = !!(await getEvaluationByAppointment(apt.id));
    }
    setEvalMap(map);
  }, [route.params.animalId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = appointments.filter((apt) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      apt.notes?.toLowerCase().includes(q) ||
      apt.status.includes(q) ||
      `${apt.date} ${apt.time}`.includes(q)
    );
  });

  if (!animal) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Acompanhamento" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Acompanhamento do Animal" />
      <ScreenContainer>
        <AppCard>
          <Text style={[styles.name, { color: colors.text }]}>{animal.name}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {animal.species}
            {animal.breed ? ` · ${animal.breed}` : ''}
          </Text>
          {animal.notes ? (
            <Text style={[styles.notes, { color: colors.textSecondary }]}>
              {animal.notes}
            </Text>
          ) : null}
        </AppCard>

        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar consultas..." />
        <Text style={[styles.section, { color: colors.text }]}>Histórico de consultas</Text>

        {filtered.map((apt) => (
          <AppCard key={apt.id}>
            <View style={styles.row}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {apt.date} às {apt.time}
              </Text>
              <StatusBadge {...appointmentStatusPresentation(apt.status)} />
            </View>
            {apt.notes ? (
              <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                {apt.notes}
              </Text>
            ) : null}
            <Text style={{ color: colors.primary, marginTop: spacing.xs }}>
              {evalMap[apt.id] ? 'Avaliação clínica registrada' : 'Sem avaliação clínica'}
            </Text>
          </AppCard>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  name: { fontSize: fontSize.xl, fontWeight: '700' },
  notes: { marginTop: spacing.sm },
  section: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
