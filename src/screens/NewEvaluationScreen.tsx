import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import { getAppointmentById } from '../services/appointmentService';
import {
  createEvaluation,
  getEvaluationByAppointment,
} from '../services/evaluationService';
import { spacing } from '../styles/theme';

export function NewEvaluationScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'NovaAvaliacao'>>();
  const { user, role } = useAuth();
  const colors = useThemeColors();

  const [clinicalNotes, setClinicalNotes] = useState('');
  const [wellbeingNotes, setWellbeingNotes] = useState('');
  const [animalId, setAnimalId] = useState('');
  const [responsavelId, setResponsavelId] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== 'veterinario') {
      setError('Apenas veterinários podem criar avaliações de bem-estar.');
    }

    getAppointmentById(route.params.appointmentId).then(async (appointment) => {
      if (!appointment) return;

      setAnimalId(appointment.animalId);
      setResponsavelId(appointment.tutorId ? Number(appointment.tutorId) : undefined);

      const existing = await getEvaluationByAppointment(appointment.id);
      if (existing) setError('Já existe avaliação de BEA para esta consulta.');
    });
  }, [route.params.appointmentId, role]);

  const handleSave = async () => {
    setError('');

    if (!user || role !== 'veterinario') return;

    if (!clinicalNotes.trim() || !wellbeingNotes.trim()) {
      setError('Preencha os campos de avaliação.');
      return;
    }

    setLoading(true);

    try {
      await createEvaluation({
        appointmentId: route.params.appointmentId,
        veterinarianId: user.veterinarioId ? String(user.veterinarioId) : user.id,
        responsavelId,
        animalId,
        score: 0,
        clinicalNotes: clinicalNotes.trim(),
        wellbeingNotes: wellbeingNotes.trim(),
      });

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Avaliação de Bem-Estar Animal" />

      <ScreenContainer>
        <AppInput
          label="Observações clínicas"
          placeholder="Descreva os achados clínicos relevantes"
          value={clinicalNotes}
          onChangeText={setClinicalNotes}
          multiline
        />

        <AppInput
          label="Bem-estar do animal"
          placeholder="Descreva comportamento, conforto, dor, alimentação e condição geral"
          value={wellbeingNotes}
          onChangeText={setWellbeingNotes}
          multiline
        />

        {error ? <Text style={{ color: colors.error, marginBottom: spacing.sm }}>{error}</Text> : null}

        <AppButton
          title="Registrar avaliação"
          onPress={handleSave}
          loading={loading}
          disabled={role !== 'veterinario'}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
