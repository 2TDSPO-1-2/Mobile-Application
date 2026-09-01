import * as notificationRepository from '../repositories/notificationRepository';
import { notFound } from '../utils/errors';

export async function listNotifications(filters?: {
  responsavelId?: number;
  clinicaId?: number;
}) {
  return notificationRepository.findNotifications(filters);
}

export async function markAsRead(id: number) {
  const updated = await notificationRepository.markNotificationRead(id);
  if (!updated) throw notFound('Notificação não encontrada.');
  return updated;
}
