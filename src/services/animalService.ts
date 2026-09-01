import type { Animal } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils/id';
import { apiDelete, apiGet, apiPost, apiPut, isNetworkError } from './apiClient';
import {
  mapApiAnimalToAnimal,
  type ApiAnimalDto,
} from './apiMappers';

async function cacheAnimals(animals: Animal[]): Promise<void> {
  await setJson(STORAGE_KEYS.animals, animals);
}

async function upsertAnimalCache(animal: Animal): Promise<void> {
  const list = await getJson<Animal[]>(STORAGE_KEYS.animals, []);
  const index = list.findIndex((a) => a.id === animal.id);
  if (index >= 0) list[index] = { ...list[index], ...animal };
  else list.push(animal);
  await cacheAnimals(list);
}

function mergeCachedAnimal(apiAnimal: Animal, cached?: Animal): Animal {
  if (!cached) return apiAnimal;

  return {
    ...apiAnimal,
    weight: cached.weight,
    birthDate: cached.birthDate,
    age: cached.age,
    size: cached.size,
    notes: cached.notes,
    createdAt: cached.createdAt || apiAnimal.createdAt,
    updatedAt: apiAnimal.updatedAt,
  };
}

export async function getAnimals(responsavelId?: number): Promise<Animal[]> {
  try {
    const query = responsavelId ? `?responsavelId=${responsavelId}` : '';
    const dtos = await apiGet<ApiAnimalDto[]>(`/animals${query}`);
    const cached = await getJson<Animal[]>(STORAGE_KEYS.animals, []);

    const tutorId = responsavelId ? String(responsavelId) : '';
    const animals = dtos.map((dto) => {
      const apiAnimal = mapApiAnimalToAnimal(
        dto,
        tutorId || String(dto.responsavelIds[0] ?? '')
      );
      const cachedItem = cached.find((item) => item.id === apiAnimal.id);
      return mergeCachedAnimal(apiAnimal, cachedItem);
    });

    await cacheAnimals(animals);
    return animals;
  } catch (error) {
    if (isNetworkError(error)) {
      const cached = await getJson<Animal[]>(STORAGE_KEYS.animals, []);
      if (responsavelId) {
        return cached.filter((a) => a.tutorId === String(responsavelId));
      }
      return cached;
    }
    throw error;
  }
}

export async function getAnimalById(id: string): Promise<Animal | undefined> {
  const cached = await getJson<Animal[]>(STORAGE_KEYS.animals, []);

  try {
    const dto = await apiGet<ApiAnimalDto>(`/animals/${id}`);
    const apiAnimal = mapApiAnimalToAnimal(dto, String(dto.responsavelIds[0] ?? ''));
    const animal = mergeCachedAnimal(apiAnimal, cached.find((a) => a.id === id));
    await upsertAnimalCache(animal);
    return animal;
  } catch (error) {
    if (isNetworkError(error)) {
      return cached.find((a) => a.id === id);
    }
    return cached.find((a) => a.id === id);
  }
}

export async function getAnimalsByTutor(
  tutorId: string,
  responsavelId?: number
): Promise<Animal[]> {
  if (responsavelId) return getAnimals(responsavelId);
  const all = await getAnimals();
  return all.filter((a) => a.tutorId === tutorId);
}

export async function createAnimal(
  data: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>,
  responsavelId?: number
): Promise<Animal> {
  const respId = responsavelId ?? Number(data.tutorId);

  try {
    const dto = await apiPost<ApiAnimalDto>('/animals', {
      name: data.name,
      speciesName: data.species,
      breedName: data.breed,
      sex: data.sex,
      neutered: data.neutered,
      responsavelId: respId,
    });

    const animal: Animal = {
      ...mapApiAnimalToAnimal(dto, String(respId)),
      weight: data.weight,
      birthDate: data.birthDate,
      age: data.age,
      size: data.size,
      notes: data.notes,
    };

    await upsertAnimalCache(animal);
    return animal;
  } catch (error) {
    if (isNetworkError(error)) {
      const now = new Date().toISOString();
      const animal: Animal = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      await upsertAnimalCache(animal);
      return animal;
    }
    throw error;
  }
}

export async function updateAnimal(animal: Animal, responsavelId?: number): Promise<Animal> {
  try {
    const dto = await apiPut<ApiAnimalDto>(`/animals/${animal.id}`, {
      name: animal.name,
      speciesName: animal.species,
      breedName: animal.breed,
      sex: animal.sex,
      neutered: animal.neutered,
      active: true,
    });

    const updated: Animal = {
      ...mapApiAnimalToAnimal(dto, String(responsavelId ?? animal.tutorId)),
      weight: animal.weight,
      birthDate: animal.birthDate,
      age: animal.age,
      size: animal.size,
      notes: animal.notes,
      updatedAt: new Date().toISOString(),
    };

    await upsertAnimalCache(updated);
    return updated;
  } catch (error) {
    if (isNetworkError(error)) {
      const updated = { ...animal, updatedAt: new Date().toISOString() };
      await upsertAnimalCache(updated);
      return updated;
    }
    throw error;
  }
}

export async function deleteAnimal(id: string): Promise<void> {
  try {
    await apiDelete(`/animals/${id}`);
    const animals = await getJson<Animal[]>(STORAGE_KEYS.animals, []);
    await cacheAnimals(animals.filter((a) => a.id !== id));
  } catch (error) {
    if (isNetworkError(error)) {
      const animals = await getJson<Animal[]>(STORAGE_KEYS.animals, []);
      await cacheAnimals(animals.filter((a) => a.id !== id));
      return;
    }
    throw error;
  }
}

export async function getSpeciesOptions(): Promise<string[]> {
  const animals = await getAnimals();
  return Array.from(new Set(animals.map((a) => a.species).filter(Boolean))).sort();
}

export async function getBreedOptions(species?: string): Promise<string[]> {
  const animals = await getAnimals();
  return Array.from(
    new Set(
      animals
        .filter((a) => !species || a.species === species)
        .map((a) => a.breed)
        .filter(Boolean) as string[]
    )
  ).sort();
}
