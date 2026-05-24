import type { Request, Response } from 'express';
import * as animalService from '../services/animalService';
import type { CreateAnimalRequest, UpdateAnimalRequest } from '../types';

export async function list(req: Request, res: Response): Promise<void> {
  const responsavelId = req.query.responsavelId
    ? Number(req.query.responsavelId)
    : undefined;
  const animals = await animalService.listAnimals(responsavelId);
  res.json(animals);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const animal = await animalService.getAnimal(Number(req.params.id));
  res.json(animal);
}

export async function create(req: Request, res: Response): Promise<void> {
  const animal = await animalService.createAnimal(req.body as CreateAnimalRequest);
  res.status(201).json(animal);
}

export async function update(req: Request, res: Response): Promise<void> {
  const animal = await animalService.updateAnimal(
    Number(req.params.id),
    req.body as UpdateAnimalRequest
  );
  res.json(animal);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const result = await animalService.deleteAnimal(Number(req.params.id));
  res.json(result);
}
