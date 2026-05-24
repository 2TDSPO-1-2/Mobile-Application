import * as animalRepository from '../repositories/animalRepository';
import { badRequest, notFound } from '../utils/errors';
import type { CreateAnimalRequest, UpdateAnimalRequest } from '../types';

export async function listAnimals(responsavelId?: number) {
  return animalRepository.findAllAnimals(responsavelId);
}

export async function getAnimal(id: number) {
  const animal = await animalRepository.findAnimalById(id);
  if (!animal) throw notFound('Animal não encontrado.');
  return animal;
}

export async function createAnimal(data: CreateAnimalRequest) {
  if (!data.name?.trim()) throw badRequest('Nome do animal é obrigatório.');
  if (!data.responsavelId) throw badRequest('responsavelId é obrigatório.');
  if (!data.speciesId && !data.speciesName) {
    throw badRequest('Informe speciesId ou speciesName.');
  }
  return animalRepository.createAnimal(data);
}

export async function updateAnimal(id: number, data: UpdateAnimalRequest) {
  const updated = await animalRepository.updateAnimal(id, data);
  if (!updated) throw notFound('Animal não encontrado.');
  return updated;
}

export async function deleteAnimal(id: number) {
  const deleted = await animalRepository.deleteAnimal(id);
  if (!deleted) throw notFound('Animal não encontrado.');
  return { success: true };
}
