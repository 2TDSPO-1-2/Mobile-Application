import * as evaluationRepository from '../repositories/evaluationRepository';
import { badRequest } from '../utils/errors';
import type { CreateEvaluationRequest } from '../types';

export async function listEvaluations(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}) {
  return evaluationRepository.findAllEvaluations(filters);
}

export async function createEvaluation(data: CreateEvaluationRequest) {
  if (!data.animalId || !data.veterinarianId) {
    throw badRequest('animalId e veterinarianId são obrigatórios.');
  }
  if (!data.clinicalNotes?.trim() || !data.wellbeingNotes?.trim()) {
    throw badRequest('clinicalNotes e wellbeingNotes são obrigatórios.');
  }
  if (data.score != null && (data.score < 0 || data.score > 10)) {
    throw badRequest('score deve estar entre 0 e 10.');
  }
  try {
    return await evaluationRepository.createEvaluation(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar avaliação.';
    throw badRequest(message);
  }
}