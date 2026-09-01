import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { EmptyState } from '../components/EmptyState';
import { useThemeColors } from '../hooks/useThemeColors';
import {
  getAnimalById,
  updateAnimal,
  getSpeciesOptions,
  getBreedOptions,
} from '../services/animalService';
import type { AppStackParamList } from '../interfaces/navigation';
import type { Animal } from '../types';
import { spacing, fontSize, radius } from '../styles/theme';
import { isEmpty } from '../utils/validation';
import { calculateAgeFromBirthDate } from '../utils/age';
import { useAuth } from '../hooks/useAuth';

const SEX_OPTIONS: Animal['sex'][] = ['macho', 'femea', 'nao_especificado'];

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

function toDisplayDate(value?: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return value;
}

export function EditAnimalScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'AtualizarAnimal'>>();
  const { user } = useAuth();
  const colors = useThemeColors();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [speciesOptions, setSpeciesOptions] = useState<string[]>([]);
  const [breedOptions, setBreedOptions] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Animal['sex']>('nao_especificado');
  const [neutered, setNeutered] = useState(false);
  const [weight, setWeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [size, setSize] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSpeciesOptions().then(setSpeciesOptions);

    getAnimalById(route.params.animalId).then((a) => {
      if (!a) return;
      setAnimal(a);
      setName(a.name);
      setSpecies(a.species);
      setBreed(a.breed ?? '');
      setSex(a.sex);
      setNeutered(a.neutered);
      setWeight(a.weight?.toString() ?? '');
      setBirthDate(toDisplayDate(a.birthDate));
      setAge(a.age?.toString() ?? '');
      setSize(a.size ?? '');
      setNotes(a.notes ?? '');
    });
  }, [route.params.animalId]);

  useEffect(() => {
    getBreedOptions(species).then(setBreedOptions);
  }, [species]);

  const onBirthDateChange = (value: string) => {
    setBirthDate(value);
    const calculated = calculateAgeFromBirthDate(toIsoDate(value));
    if (calculated != null) setAge(String(calculated));
  };

  const handleSave = async () => {
    if (!animal) return;

    if (isEmpty(name) || isEmpty(species)) {
      setError('Nome e espécie são obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      await updateAnimal(
        {
          ...animal,
          name: name.trim(),
          species: species.trim(),
          breed: breed.trim() || undefined,
          sex,
          neutered,
          weight: weight ? parseFloat(weight.replace(',', '.')) : undefined,
          birthDate: birthDate.trim() ? toIsoDate(birthDate) : undefined,
          age: age ? parseInt(age, 10) : undefined,
          size: size.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        user?.responsavelId
      );

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o animal.');
    } finally {
      setLoading(false);
    }
  };

  if (!animal) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader title="Atualizar Animal" />
        <EmptyState title="Animal não encontrado" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Atualizar Animal" />
      <ScreenContainer>
        <AppInput label="Nome do animal *" placeholder="Ex.: Lulu" value={name} onChangeText={setName} />

        <Text style={[styles.label, { color: colors.text }]}>Espécie *</Text>
        <View style={styles.chipRow}>
          {speciesOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSpecies(option)}
              style={[
                styles.chip,
                { backgroundColor: species === option ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: species === option ? '#FFF' : colors.text }}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Raça</Text>
        <View style={styles.chipRow}>
          {breedOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setBreed(option)}
              style={[
                styles.chip,
                { backgroundColor: breed === option ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: breed === option ? '#FFF' : colors.text }}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Sexo</Text>
        <View style={styles.chipRow}>
          {SEX_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSex(opt)}
              style={[
                styles.chip,
                { backgroundColor: sex === opt ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: sex === opt ? '#FFF' : colors.text }}>
                {opt === 'nao_especificado' ? 'Não especificado' : opt === 'macho' ? 'Macho' : 'Fêmea'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={{ color: colors.text }}>Castrado</Text>
          <Switch value={neutered} onValueChange={setNeutered} trackColor={{ true: colors.primary }} />
        </View>

        <AppInput label="Peso (kg)" placeholder="Ex.: 14" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        <AppInput label="Data de nascimento" placeholder="DD-MM-AAAA" value={birthDate} onChangeText={onBirthDateChange} />
        <AppInput label="Idade" placeholder="Calculada automaticamente" value={age} onChangeText={setAge} keyboardType="number-pad" />
        <AppInput label="Porte" placeholder="Ex.: Médio" value={size} onChangeText={setSize} />
        <AppInput label="Observações" placeholder="Observações relevantes sobre o animal" value={notes} onChangeText={setNotes} multiline />

        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        <AppButton title="Salvar alterações" onPress={handleSave} loading={loading} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: { padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
