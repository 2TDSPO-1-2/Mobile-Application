import * as feedbackRepository from '../repositories/feedbackRepository';
import { badRequest } from '../utils/errors';
import type { CreateFeedbackRequest } from '../types';

export async function listFeedbacks() {
  return feedbackRepository.findAllFeedbacks();
}

export async function createFeedback(data: CreateFeedbackRequest) {
  if (data.rating == null || data.rating < 0 || data.rating > 10) {
    throw badRequest('rating deve estar entre 0 e 10.');
  }
  if (
    !data.veterinarianId &&
    !data.responsavelId &&
    !data.animalId &&
    !data.clinicaId &&
    !data.appointmentId
  ) {
    throw badRequest('Informe ao menos um contexto (veterinário, responsável, animal, clínica ou consulta).');
  }
  return feedbackRepository.createFeedback(data);
}
