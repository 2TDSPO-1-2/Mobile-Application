import type { Evaluation } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils/id';
import { apiGet, apiPost, isNetworkError } from './apiClient';
import {
  mapApiEvaluationToEvaluation,
  type ApiEvaluationDto,
} from './apiMappers';

async function cacheEvaluations(list: Evaluation[]): Promise<void> {
  await setJson(STORAGE_KEYS.evaluations, list);
}

export async function getEvaluations(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}): Promise<Evaluation[]> {
  try {
    const params = new URLSearchParams();

    if (filters?.responsavelId) {
      params.set('responsavelId', String(filters.responsavelId));
    }

    if (filters?.veterinarianId) {
      params.set('veterinarianId', String(filters.veterinarianId));
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const dtos = await apiGet<ApiEvaluationDto[]>(`/evaluations${query}`);
    const list = dtos.map(mapApiEvaluationToEvaluation);

    await cacheEvaluations(list);
    return list;
  } catch (error) {
    if (isNetworkError(error)) {
      return getJson<Evaluation[]>(STORAGE_KEYS.evaluations, []);
    }

    throw error;
  }
}

export async function getEvaluationByAppointment(
  appointmentId: string
): Promise<Evaluation | undefined> {
  const list = await getEvaluations();
  return list.find((evaluation) => evaluation.appointmentId === appointmentId);
}

export async function createEvaluation(
  data: Omit<Evaluation, 'id' | 'createdAt' | 'veterinarianId'> & {
    responsavelId?: number;
    veterinarianId?: number | string;
    age?: number;
    weightKg?: number;
  }
): Promise<Evaluation> {
  try {
    const dto = await apiPost<ApiEvaluationDto>('/evaluations', {
      animalId: Number(data.animalId),
      veterinarianId:
        data.veterinarianId != null ? Number(data.veterinarianId) : undefined,
      responsavelId: data.responsavelId,
      appointmentId: data.appointmentId
        ? Number(data.appointmentId)
        : undefined,
      score: data.score,
      clinicalNotes: data.clinicalNotes,
      wellbeingNotes: data.wellbeingNotes,
      age: data.age,
      weightKg: data.weightKg,
    });

    const evaluation = mapApiEvaluationToEvaluation(dto);
    const list = await getJson<Evaluation[]>(STORAGE_KEYS.evaluations, []);
    list.push(evaluation);
    await cacheEvaluations(list);

    return evaluation;
  } catch (error) {
    if (isNetworkError(error)) {
      const evaluation: Evaluation = {
        appointmentId: data.appointmentId,
        veterinarianId:
          data.veterinarianId != null ? String(data.veterinarianId) : '',
        animalId: data.animalId,
        score: data.score,
        clinicalNotes: data.clinicalNotes,
        wellbeingNotes: data.wellbeingNotes,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      const list = await getJson<Evaluation[]>(STORAGE_KEYS.evaluations, []);
      list.push(evaluation);
      await cacheEvaluations(list);

      return evaluation;
    }

    throw error;
  }
}