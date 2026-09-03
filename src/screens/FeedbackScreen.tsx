import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { RatingInput } from '../components/RatingInput';
import { AppCard } from '../components/AppCard';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import { createFeedback, getFeedbacksForUser } from '../services/feedbackService';
import { getAppointmentById } from '../services/appointmentService';
import { getUsers } from '../services/userService';
import type { Feedback, User } from '../types';
import { formatDateTime } from '../utils/date';
import { spacing, fontSize } from '../styles/theme';

export function FeedbackScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'Feedback'>>();
  const { user, role } = useAuth();
  const colors = useThemeColors();

  const [targets, setTargets] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState(route.params?.targetUserId ?? '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [history, setHistory] = useState<Feedback[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const currentUser = user;
    const appointmentId = route.params?.appointmentId;

    async function load() {
      const users = await getUsers();
      let opposite = users.filter(
        (u) => u.role !== currentUser.role && u.id !== currentUser.id
      );

      if (appointmentId) {
        const appointment = await getAppointmentById(appointmentId);

        if (appointment?.veterinarianId && role === 'tutor') {
          const vet = users.find(
            (u) => String(u.veterinarioId) === String(appointment.veterinarianId)
          );

          if (vet) {
            opposite = [vet];
          }
        }
      }

      opposite = opposite.sort((a, b) => a.name.localeCompare(b.name));
      setTargets(opposite);

      if (!targetUserId && opposite.length > 0) {
        setTargetUserId(opposite[0].id);
      }

      setHistory(await getFeedbacksForUser(currentUser.id));
    }

    load().catch(() => setError('Não foi possível carregar os dados de feedback.'));
  }, [user, role, targetUserId, route.params?.appointmentId]);

  const targetLabel = useMemo(
    () => (role === 'tutor' ? 'Avaliar veterinário' : 'Avaliar tutor'),
    [role]
  );

  const handleSave = async () => {
    setError('');

    if (!user || !targetUserId) {
      setError('Selecione um usuário para avaliar.');
      return;
    }

    if (!comment.trim()) {
      setError('Informe um comentário.');
      return;
    }

    const target = targets.find((t) => t.id === targetUserId);
    if (!target) {
      setError('Usuário alvo não encontrado.');
      return;
    }

    setLoading(true);

    try {
      await createFeedback({
        fromUserId: user.id,
        toUserId: targetUserId,
        appointmentId: route.params?.appointmentId,
        rating,
        comment: comment.trim(),
        fromUser: user,
        toUser: target,
      });

      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível lançar feedback.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const received = user
    ? history.filter((feedback) => feedback.toUserId === user.id)
    : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Feedback" />

      <ScreenContainer>
        {route.params?.appointmentId ? (
          <>
            <Text style={[styles.info, { color: colors.textSecondary }]}>
              Feedback vinculado à consulta #{route.params.appointmentId}.
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>{targetLabel}</Text>

            {targets.map((target) => (
              <AppCard
                key={target.id}
                onPress={() => setTargetUserId(target.id)}
                style={
                  targetUserId === target.id
                    ? { borderColor: colors.primary, borderWidth: 2 }
                    : undefined
                }
              >
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {target.name}
                </Text>
                {target.role === 'veterinario' && target.crmv ? (
                  <Text style={{ color: colors.textSecondary }}>
                    CRMV {target.crmv}
                  </Text>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>
                    Tutor ArkIve
                  </Text>
                )}
              </AppCard>
            ))}

            <Text style={[styles.label, { color: colors.text }]}>Nota</Text>
            <RatingInput value={rating} onChange={setRating} max={5} />

            <AppInput
              label="Comentário"
              placeholder="Digite seu feedback"
              value={comment}
              onChangeText={setComment}
              multiline
            />

            {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}

            <AppButton title="Enviar feedback" onPress={handleSave} loading={loading} />
          </>
        ) : (
          <>
            <Text style={[styles.section, { color: colors.text }]}>
              Meus feedbacks recebidos
            </Text>

            {received.length === 0 ? (
              <EmptyState
                title="Sem feedbacks"
                message="Feedbacks recebidos aparecerão aqui após consultas."
              />
            ) : (
              received.map((feedback) => (
                <AppCard key={feedback.id}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    ★ {feedback.rating}/5
                  </Text>
                  <Text style={{ color: colors.text }}>{feedback.comment}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                    {formatDateTime(feedback.createdAt)}
                  </Text>
                </AppCard>
              ))
            )}
          </>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  info: { marginBottom: spacing.md, fontSize: fontSize.sm },
  label: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  section: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
});