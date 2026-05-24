import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import type { AppStackParamList } from '../interfaces/navigation';
import type { Animal, User } from '../types';
import { getAnimalsByTutor } from '../services/animalService';
import { createAppointment } from '../services/appointmentService';
import { getUsers } from '../services/userService';
import { spacing, fontSize, radius } from '../styles/theme';

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

export function NewAppointmentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'NovaConsulta'>>();
  const { user } = useAuth();
  const colors = useThemeColors();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [animalId, setAnimalId] = useState(route.params?.animalId ?? '');
  const [veterinarianId, setVeterinarianId] = useState('');
  const [vetSearch, setVetSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    getAnimalsByTutor(user.id, user.responsavelId).then((list) => {
      setAnimals(list);
      if (!animalId && list.length > 0) setAnimalId(list[0].id);
    });

    getUsers().then((users) => {
      const vets = users
        .filter((u) => u.role === 'veterinario' && u.veterinarioId)
        .sort((a, b) => a.name.localeCompare(b.name));

      setVeterinarians(vets);
    });
  }, [user, animalId]);

  const filteredVets = useMemo(() => {
    const q = vetSearch.trim().toLowerCase();

    if (!q) return veterinarians.slice(0, 3);

    return veterinarians.filter((vet) => {
      return (
        vet.name.toLowerCase().includes(q) ||
        vet.crmv?.toLowerCase().includes(q) ||
        vet.specialty?.toLowerCase().includes(q)
      );
    });
  }, [veterinarians, vetSearch]);

  const handleSave = async () => {
    setError('');

    if (!user || !animalId) {
      setError('Selecione um animal.');
      return;
    }

    if (!veterinarianId) {
      setError('Selecione um veterinário.');
      return;
    }

    if (!date.trim() || !time.trim()) {
      setError('Informe data e horário da consulta.');
      return;
    }

    if (!notes.trim()) {
      setError('Digite o motivo da consulta.');
      return;
    }

    setLoading(true);

    try {
      await createAppointment(
        {
          animalId,
          tutorId: user.id,
          veterinarianId,
          date: toIsoDate(date),
          time: time.trim(),
          status: 'solicitada',
          notes: notes.trim(),
        },
        { veterinarianId: Number(veterinarianId) }
      );

      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível solicitar a consulta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergência',
      'Contate a clínica veterinária mais próxima imediatamente. Esta ação não cria consulta no sistema.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Nova Consulta" />

      <ScreenContainer>
        <Text style={[styles.label, { color: colors.text }]}>Animal</Text>
        {animals.map((animal) => (
          <Pressable
            key={animal.id}
            onPress={() => setAnimalId(animal.id)}
            style={[
              styles.optionBtn,
              {
                backgroundColor:
                  animalId === animal.id ? colors.primaryLight : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: animalId === animal.id ? '700' : '400' }}>
              {animal.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
              {animal.species}{animal.breed ? ` · ${animal.breed}` : ''}
            </Text>
          </Pressable>
        ))}

        <Text style={[styles.label, { color: colors.text }]}>Veterinário</Text>
        <SearchBar
          value={vetSearch}
          onChangeText={setVetSearch}
          placeholder="Pesquisar por nome, CRMV ou especialidade..."
        />

        {filteredVets.map((vet) => (
          <Pressable
            key={vet.id}
            onPress={() => setVeterinarianId(String(vet.veterinarioId))}
            style={[
              styles.optionBtn,
              {
                backgroundColor:
                  veterinarianId === String(vet.veterinarioId)
                    ? colors.primaryLight
                    : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: veterinarianId === String(vet.veterinarioId) ? '700' : '400',
              }}
            >
              {vet.name}
            </Text>

            {vet.crmv ? (
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                CRMV {vet.crmv}
              </Text>
            ) : null}

            {vet.specialty ? (
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                {vet.specialty}
              </Text>
            ) : null}
          </Pressable>
        ))}

        <AppInput
          label="Data"
          placeholder="DD-MM-AAAA"
          value={date}
          onChangeText={setDate}
        />

        <AppInput
          label="Horário"
          placeholder="HH:MM"
          value={time}
          onChangeText={setTime}
        />

        <AppInput
          label="Observação"
          value={notes}
          onChangeText={setNotes}
          placeholder="Digite o motivo da consulta."
          multiline
        />

        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}

        <AppButton title="Solicitar consulta" onPress={handleSave} loading={loading} />
        <AppButton title="Emergência" variant="danger" onPress={handleEmergency} />

        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          O botão de emergência não cria consulta — use em situações urgentes.
        </Text>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  optionBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  hint: { fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.sm },
});
