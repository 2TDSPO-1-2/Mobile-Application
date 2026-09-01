import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../components/AppHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '../hooks/useThemeColors';
import { createAnimal, getBreedOptions, getSpeciesOptions } from '../services/animalService';
import type { Animal } from '../types';
import { spacing, fontSize, radius } from '../styles/theme';
import { isEmpty } from '../utils/validation';
import { calculateAgeFromBirthDate } from '../utils/age';

const SEX_OPTIONS: Animal['sex'][] = ['macho', 'femea', 'nao_especificado'];

function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return trimmed;
}

export function NewAnimalScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const colors = useThemeColors();

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
    getSpeciesOptions().then((options) => {
      setSpeciesOptions(options);
      if (!species && options.length > 0) setSpecies(options[0]);
    });
  }, []);

  useEffect(() => {
    getBreedOptions(species).then((options) => {
      setBreedOptions(options);
      if (breed && !options.includes(breed)) setBreed('');
    });
  }, [species]);

  const onBirthDateChange = (value: string) => {
    setBirthDate(value);
    const calculated = calculateAgeFromBirthDate(toIsoDate(value));
    if (calculated != null) setAge(String(calculated));
  };

  const handleSave = async () => {
    setError('');

    if (!user) return;

    if (isEmpty(name) || isEmpty(species)) {
      setError('Nome e espécie são obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      await createAnimal(
        {
          tutorId: user.id,
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
        user.responsavelId
      );

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o animal.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBreedLabel = useMemo(
    () => breed || 'Selecione uma raça',
    [breed]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title="Novo Animal" />

      <ScreenContainer>
        <AppInput
          label="Nome do animal *"
          placeholder="Ex.: Lulu"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Espécie *</Text>
        <View style={styles.chipRow}>
          {speciesOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSpecies(option)}
              style={[
                styles.chip,
                {
                  backgroundColor: species === option ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: species === option ? '#FFF' : colors.text }}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Raça</Text>
        <View style={styles.chipRow}>
          {breedOptions.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>Nenhuma raça disponível.</Text>
          ) : (
            breedOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setBreed(option)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: breed === option ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: breed === option ? '#FFF' : colors.text }}>
                  {option}
                </Text>
              </Pressable>
            ))
          )}
        </View>
        <Text style={[styles.helper, { color: colors.textSecondary }]}>{selectedBreedLabel}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Sexo</Text>
        <View style={styles.chipRow}>
          {SEX_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setSex(opt)}
              style={[
                styles.chip,
                {
                  backgroundColor: sex === opt ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
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
        <AppButton title="Salvar animal" onPress={handleSave} loading={loading} />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  helper: { marginBottom: spacing.md, fontSize: fontSize.xs },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
});
