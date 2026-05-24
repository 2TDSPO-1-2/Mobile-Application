import type { AppNotification } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils/id';
import { apiGet, apiPut, isNetworkError } from './apiClient';
import {
  mapApiNotificationToAppNotification,
  type ApiNotificationDto,
} from './apiMappers';

async function cacheNotifications(list: AppNotification[]): Promise<void> {
  await setJson(STORAGE_KEYS.notifications, list);
}

export async function getNotifications(filters?: {
  responsavelId?: number;
  clinicaId?: number;
  userId: string;
}): Promise<AppNotification[]> {
  if (!filters?.userId) return [];

  try {
    const params = new URLSearchParams();

    if (filters.responsavelId) {
      params.set('responsavelId', String(filters.responsavelId));
    }

    if (filters.clinicaId) {
      params.set('clinicaId', String(filters.clinicaId));
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const dtos = await apiGet<ApiNotificationDto[]>(`/notifications${query}`);

    const list = dtos.map((dto) =>
      mapApiNotificationToAppNotification(dto, filters.userId)
    );

    await cacheNotifications(list);
    return list;
  } catch (error) {
    if (isNetworkError(error)) {
      const cached = await getJson<AppNotification[]>(
        STORAGE_KEYS.notifications,
        []
      );

      return cached.filter((notification) => notification.userId === filters.userId);
    }

    throw error;
  }
}

export async function getNotificationsByUser(
  userId: string,
  responsavelId?: number,
  clinicaId?: number
): Promise<AppNotification[]> {
  return getNotifications({ userId, responsavelId, clinicaId });
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await apiPut(`/notifications/${id}/read`, {});

    const list = await getJson<AppNotification[]>(STORAGE_KEYS.notifications, []);
    const updated = list.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    );

    await cacheNotifications(updated);
  } catch (error) {
    if (isNetworkError(error)) {
      const list = await getJson<AppNotification[]>(
        STORAGE_KEYS.notifications,
        []
      );

      const updated = list.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      await cacheNotifications(updated);
      return;
    }

    throw error;
  }
}

export async function markAllRead(userId: string): Promise<void> {
  const list = await getJson<AppNotification[]>(STORAGE_KEYS.notifications, []);

  const unreadFromUser = list.filter(
    (notification) => notification.userId === userId && !notification.read
  );

  await Promise.all(
    unreadFromUser.map(async (notification) => {
      try {
        await apiPut(`/notifications/${notification.id}/read`, {});
      } catch (error) {
        if (!isNetworkError(error)) {
          throw error;
        }
      }
    })
  );

  const updated = list.map((notification) =>
    notification.userId === userId ? { ...notification, read: true } : notification
  );

  await cacheNotifications(updated);
}

export async function createNotificationLocal(
  data: Omit<AppNotification, 'id' | 'createdAt' | 'read'>
): Promise<AppNotification> {
  const list = await getJson<AppNotification[]>(STORAGE_KEYS.notifications, []);

  const notification: AppNotification = {
    ...data,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  list.push(notification);
  await cacheNotifications(list);

  return notification;
}