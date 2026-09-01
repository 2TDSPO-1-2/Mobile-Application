import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeHeader } from '../components/HomeHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import type { Appointment, Feedback } from '../types';
import {
  getAppointments,
  updateAppointmentStatus,
} from '../services/appointmentService';
import { getAnimalById } from '../services/animalService';
import { getFeedbacks } from '../services/feedbackService';
import { getEvaluationByAppointment } from '../services/evaluationService';
import { commonStyles } from '../styles/common';
import { spacing, fontSize } from '../styles/theme';

type SectionKey = 'solicitadas' | 'marcadas' | 'realizadas';

export function AgendaScreen() {
  const { user, role } = useAuth();
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [animalNames, setAnimalNames] = useState<Record<string, string>>({});
  const [feedbackByAppointment, setFeedbackByAppointment] = useState<Record<string, Feedback>>({});
  const [hasEvaluation, setHasEvaluation] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!user) return;

    const filters =
      role === 'tutor'
        ? { responsavelId: user.responsavelId }
        : { veterinarianId: user.veterinarioId };

    const list = await getAppointments(filters);
    setAppointments(list);

    const names: Record<string, string> = {};
    const evaluations: Record<string, boolean> = {};

    for (const appointment of list) {
      const animal = await getAnimalById(appointment.animalId);
      names[appointment.animalId] = animal?.name ?? 'Animal';

      const evaluation = await getEvaluationByAppointment(appointment.id);
      evaluations[appointment.id] = Boolean(evaluation);
    }

    const feedbacks = await getFeedbacks(user.id);
    const feedbackMap: Record<string, Feedback> = {};

    for (const feedback of feedbacks) {
      if (feedback.appointmentId) feedbackMap[feedback.appointmentId] = feedback;
    }

    setAnimalNames(names);
    setHasEvaluation(evaluations);
    setFeedbackByAppointment(feedbackMap);
  }, [user, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const list = appointments.filter((appointment) => {
      if (!q) return true;

      return (
        animalNames[appointment.animalId]?.toLowerCase().includes(q) ||
        appointment.notes?.toLowerCase().includes(q) ||
        appointment.status.includes(q)
      );
    });

    return list.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [appointments, search, animalNames]);

  const sections = useMemo(() => {
    const result: Record<SectionKey, Appointment[]> = {
      solicitadas: [],
      marcadas: [],
      realizadas: [],
    };

    for (const appointment of filtered) {
      if (appointment.status === 'solicitada') result.solicitadas.push(appointment);
      else if (appointment.status === 'confirmada') result.marcadas.push(appointment);
      else result.realizadas.push(appointment);
    }

    return result;
  }, [filtered]);

  const confirmAppointment = async (appointment: Appointment) => {
    if (!user) return;
    await updateAppointmentStatus(
      appointment.id,
      'confirmada',
      user.veterinarioId ?? user.id
    );
    load();
  };

  const completeAppointment = async (appointment: Appointment) => {
    if (!user) return;

    if (!hasEvaluation[appointment.id]) {
      navigation.navigate('NovaAvaliacao', { appointmentId: appointment.id });
      return;
    }

    await updateAppointmentStatus(
      appointment.id,
      'realizada',
      user.veterinarioId ?? user.id
    );
    load();
  };

  const handleFeedback = (appointment: Appointment) => {
    const feedback = feedbackByAppointment[appointment.id];

    if (feedback) {
      setExpanded((current) => ({
        ...current,
        [appointment.id]: !current[appointment.id],
      }));
      return;
    }

    navigation.navigate('Feedback', { appointmentId: appointment.id });
  };

  const renderAppointment = (appointment: Appointment) => {
    const feedback = feedbackByAppointment[appointment.id];
    const expandedCard = expanded[appointment.id];

    return (
      <AppCard key={appointment.id} onPress={() => setExpanded((current) => ({ ...current, [appointment.id]: !current[appointment.id] }))}>
        <View style={styles.row}>
          <Text style={[styles.animal, { color: colors.text }]}>
            {animalNames[appointment.animalId] ?? 'Animal'}
          </Text>
          <StatusBadge status={appointment.status} />
        </View>

        <Text style={{ color: colors.textSecondary }}>
          {appointment.date} · {appointment.time}
        </Text>

        {appointment.notes ? (
          <Text style={{ color: colors.textSecondary, marginTop: spacing.xs }}>
            {appointment.notes}
          </Text>
        ) : null}

        {expandedCard ? (
          <View style={[styles.expanded, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary }}>
              Consulta #{appointment.id}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Avaliação BEA: {hasEvaluation[appointment.id] ? 'registrada' : 'pendente'}
            </Text>
            {feedback ? (
              <>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  ★ {feedback.rating}/5
                </Text>
                <Text style={{ color: colors.text }}>{feedback.comment}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {role === 'veterinario' && appointment.status === 'solicitada' ? (
          <AppButton
            title="Confirmar consulta"
            onPress={() => confirmAppointment(appointment)}
            style={styles.btn}
          />
        ) : null}

        {role === 'veterinario' && appointment.status === 'confirmada' ? (
          <>
            {!hasEvaluation[appointment.id] ? (
              <AppButton
                title="Avaliação BEA"
                variant="outline"
                onPress={() =>
                  navigation.navigate('NovaAvaliacao', { appointmentId: appointment.id })
                }
                style={styles.btn}
              />
            ) : null}

            <AppButton
              title="Marcar como realizada"
              variant="secondary"
              onPress={() => completeAppointment(appointment)}
              style={styles.btn}
            />
          </>
        ) : null}

        <AppButton
          title={feedback ? 'Feedback recebido' : 'Feedback'}
          variant="outline"
          onPress={() => handleFeedback(appointment)}
          style={styles.btn}
        />
      </AppCard>
    );
  };

  const renderSection = (title: string, items: Appointment[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.sm }}>
          Nenhuma consulta nesta seção.
        </Text>
      ) : (
        items.map(renderAppointment)
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <HomeHeader />

      <ScreenContainer>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Agenda</Text>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar consultas..."
        />

        {filtered.length === 0 ? (
          <EmptyState title="Agenda vazia" message="Nenhuma consulta encontrada." />
        ) : (
          <>
            {renderSection('Consultas solicitadas', sections.solicitadas)}
            {renderSection('Consultas marcadas', sections.marcadas)}
            {renderSection('Consultas realizadas', sections.realizadas)}
          </>
        )}

        {role === 'tutor' ? (
          <Pressable
            style={[commonStyles.fab, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NovaConsulta', {})}
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
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  animal: { fontSize: fontSize.lg, fontWeight: '700' },
  btn: { marginTop: spacing.sm },
  fabText: { color: '#FFF', fontSize: 28 },
  expanded: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
});
