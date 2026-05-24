import type { Appointment, AppointmentStatus } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { generateId } from '../utils/id';
import { isToday } from '../utils/date';
import { apiGet, apiPost, apiPut, isNetworkError } from './apiClient';
import {
  mapApiAppointmentToAppointment,
  type ApiAppointmentDto,
} from './apiMappers';

async function cacheAppointments(list: Appointment[]): Promise<void> {
  await setJson(STORAGE_KEYS.appointments, list);
}

export async function getAppointments(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}): Promise<Appointment[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.responsavelId) params.set('responsavelId', String(filters.responsavelId));
    if (filters?.veterinarianId) params.set('veterinarianId', String(filters.veterinarianId));
    const query = params.toString() ? `?${params.toString()}` : '';
    const dtos = await apiGet<ApiAppointmentDto[]>(`/appointments${query}`);
    const list = dtos.map((d) =>
      mapApiAppointmentToAppointment(d, filters?.responsavelId ? String(filters.responsavelId) : '')
    );
    await cacheAppointments(list);
    return list;
  } catch (error) {
    if (isNetworkError(error)) {
      return getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
    }
    throw error;
  }
}

export async function getAppointmentById(id: string): Promise<Appointment | undefined> {
  try {
    const dto = await apiGet<ApiAppointmentDto>(`/appointments/${id}`);
    const apt = mapApiAppointmentToAppointment(dto);
    const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
    const index = list.findIndex((a) => a.id === id);
    if (index >= 0) list[index] = apt;
    else list.push(apt);
    await cacheAppointments(list);
    return apt;
  } catch (error) {
    if (isNetworkError(error)) {
      const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
      return list.find((a) => a.id === id);
    }
    return undefined;
  }
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
  options?: { veterinarianId?: number; weightKg?: number }
): Promise<Appointment> {
  const dateTime = `${data.date}T${data.time}:00`;

  try {
    const dto = await apiPost<ApiAppointmentDto>('/appointments', {
      animalId: Number(data.animalId),
      veterinarianId: options?.veterinarianId ?? (data.veterinarianId ? Number(data.veterinarianId) : undefined),
      dateTime,
      modality: 'PRESENCIAL',
      reason: data.notes ?? 'Consulta solicitada',
      notes: data.notes,
      weightKg: options?.weightKg,
    });
    const apt = mapApiAppointmentToAppointment(dto, data.tutorId);
    const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
    list.push(apt);
    await cacheAppointments(list);
    return apt;
  } catch (error) {
    if (isNetworkError(error)) {
      const now = new Date().toISOString();
      const apt: Appointment = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
      list.push(apt);
      await cacheAppointments(list);
      return apt;
    }
    throw error;
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  veterinarianId?: string | number
): Promise<Appointment | null> {
  try {
    const dto = await apiPut<ApiAppointmentDto>(`/appointments/${id}/status`, {
      status,
      veterinarianId: veterinarianId != null ? Number(veterinarianId) : undefined,
    });
    const apt = mapApiAppointmentToAppointment(dto);
    const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
    const index = list.findIndex((a) => a.id === id);
    if (index >= 0) list[index] = apt;
    else list.push(apt);
    await cacheAppointments(list);
    return apt;
  } catch (error) {
    if (isNetworkError(error)) {
      const list = await getJson<Appointment[]>(STORAGE_KEYS.appointments, []);
      const index = list.findIndex((a) => a.id === id);
      if (index < 0) return null;
      list[index] = {
        ...list[index],
        status,
        veterinarianId: veterinarianId != null ? String(veterinarianId) : list[index].veterinarianId,
        updatedAt: new Date().toISOString(),
      };
      await cacheAppointments(list);
      return list[index];
    }
    throw error;
  }
}

export function sortAppointments(appointments: Appointment[]): Appointment[] {
  const today: Appointment[] = [];
  const requested: Appointment[] = [];
  const done: Appointment[] = [];

  for (const apt of appointments) {
    if (apt.status === 'realizada' || apt.status === 'cancelada') {
      done.push(apt);
    } else if (isToday(apt.date)) {
      today.push(apt);
    } else {
      requested.push(apt);
    }
  }

  const byDate = (a: Appointment, b: Appointment) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

  return [
    ...today.sort(byDate),
    ...requested.filter((a) => a.status === 'solicitada').sort(byDate),
    ...requested.filter((a) => a.status !== 'solicitada').sort(byDate),
    ...done.sort(byDate),
  ];
}
