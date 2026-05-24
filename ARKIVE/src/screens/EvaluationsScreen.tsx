import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import { getAnimalById, getAnimalsByTutor } from '../services/animalService';
import { getAppointmentById } from '../services/appointmentService';
import { getEvaluations } from '../services/evaluationService';
import { fontSize, spacing } from '../styles/theme';
import type { Evaluation } from '../types';
import { formatDateTime } from '../utils/date';

interface EvalItem extends Evaluation {
  animalName: string;
  appointmentDate: string;
}

export function EvaluationsScreen() {
  const { user, role } = useAuth();
  const colors = useThemeColors();

  const [items, setItems] = useState<EvalItem[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!user) return;

    const evaluations = await getEvaluations(
      role === 'tutor'
        ? { responsavelId: user.responsavelId }
        : { veterinarianId: user.veterinarioId }
    );

    let allowedAnimalIds: string[] | null = null;

    if (role === 'tutor') {
      const tutorAnimals = await getAnimalsByTutor(user.id, user.responsavelId);
      allowedAnimalIds = tutorAnimals.map((animal) => animal.id);
    }

    const enriched: EvalItem[] = [];

    for (const evaluation of evaluations) {
      if (allowedAnimalIds && !allowedAnimalIds.includes(evaluation.animalId)) {
        continue;
      }

      const appointment = evaluation.appointmentId
        ? await getAppointmentById(evaluation.appointmentId)
        : undefined;

      const animal = await getAnimalById(evaluation.animalId);

      enriched.push({
        ...evaluation,
        animalName: animal?.name ?? 'Animal',
        appointmentDate: appointment ? `${appointment.date} ${appointment.time}` : '',
      });
    }

    setItems(enriched);
  }, [user, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return items;

    return items.filter(
      (evaluation) =>
        evaluation.animalName.toLowerCase().includes(q) ||
        evaluation.clinicalNotes.toLowerCase().includes(q) ||
        evaluation.wellbeingNotes.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Avaliações de bem-estar" />

      <ScreenContainer>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar avaliações..."
        />

        {filtered.length === 0 ? (
          <EmptyState
            title="Sem avaliações"
            message={
              role === 'veterinario'
                ? 'Registre avaliações em consultas realizadas pela Agenda.'
                : 'Avaliações são criadas pelo veterinário após consultas.'
            }
          />
        ) : (
          filtered.map((evaluation) => (
            <AppCard key={evaluation.id}>
              <Text style={[styles.title, { color: colors.text }]}>
                {evaluation.animalName}
              </Text>

              {evaluation.appointmentDate ? (
                <Text style={{ color: colors.textSecondary }}>
                  Consulta: {evaluation.appointmentDate}
                </Text>
              ) : null}

              {evaluation.clinicalNotes ? (
                <Text style={{ color: colors.text, marginTop: spacing.xs }}>
                  {evaluation.clinicalNotes}
                </Text>
              ) : null}

              {evaluation.wellbeingNotes ? (
                <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
                  Bem-estar: {evaluation.wellbeingNotes}
                </Text>
              ) : null}

              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                {formatDateTime(evaluation.createdAt)}
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
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});