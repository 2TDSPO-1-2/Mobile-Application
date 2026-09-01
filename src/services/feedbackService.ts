import type { Feedback, User } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils/id';
import { apiGet, apiPost, isNetworkError } from './apiClient';
import {
  mapApiFeedbackToFeedback,
  type ApiFeedbackDto,
} from './apiMappers';

async function cacheFeedbacks(list: Feedback[]): Promise<void> {
  await setJson(STORAGE_KEYS.feedbacks, list);
}

export async function getFeedbacks(currentUserId = ''): Promise<Feedback[]> {
  try {
    const dtos = await apiGet<ApiFeedbackDto[]>('/feedbacks');
    const list = dtos.map((dto) => mapApiFeedbackToFeedback(dto, currentUserId));
    await cacheFeedbacks(list);
    return list;
  } catch (error) {
    if (isNetworkError(error)) {
      return getJson<Feedback[]>(STORAGE_KEYS.feedbacks, []);
    }

    throw error;
  }
}

export async function getFeedbacksForUser(userId: string): Promise<Feedback[]> {
  const list = await getFeedbacks(userId);
  return list.filter((feedback) => feedback.fromUserId === userId || feedback.toUserId === userId);
}

export async function getFeedbackByAppointment(
  appointmentId: string
): Promise<Feedback | undefined> {
  const list = await getFeedbacks();
  return list.find((feedback) => feedback.appointmentId === appointmentId);
}

export async function createFeedback(
  data: Omit<Feedback, 'id' | 'createdAt'> & {
    fromUser: User;
    toUser: User;
    animalId?: number;
    appointmentId?: number | string;
  }
): Promise<Feedback> {
  const body: Record<string, unknown> = {
    rating: data.rating,
    comment: data.comment,
    appointmentId: data.appointmentId ? Number(data.appointmentId) : undefined,
    animalId: data.animalId,
  };

  if (data.fromUser.role === 'tutor') {
    body.responsavelId = data.fromUser.responsavelId;
    body.veterinarianId = data.toUser.veterinarioId;
  } else {
    body.veterinarianId = data.fromUser.veterinarioId;
    body.responsavelId = data.toUser.responsavelId;
  }

  try {
    const dto = await apiPost<ApiFeedbackDto>('/feedbacks', body);
    const feedback: Feedback = {
      id: String(dto.id),
      fromUserId: data.fromUser.id,
      toUserId: data.toUser.id,
      appointmentId: data.appointmentId ? String(data.appointmentId) : undefined,
      rating: dto.rating,
      comment: dto.comment ?? '',
      createdAt: dto.createdAt,
    };

    const list = await getJson<Feedback[]>(STORAGE_KEYS.feedbacks, []);
    list.push(feedback);
    await cacheFeedbacks(list);

    return feedback;
  } catch (error) {
    if (isNetworkError(error)) {
      const feedback: Feedback = {
        ...data,
        appointmentId: data.appointmentId ? String(data.appointmentId) : undefined,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      const list = await getJson<Feedback[]>(STORAGE_KEYS.feedbacks, []);
      list.push(feedback);
      await cacheFeedbacks(list);

      return feedback;
    }

    throw error;
  }
}
