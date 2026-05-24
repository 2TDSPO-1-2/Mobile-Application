import * as appointmentRepository from '../repositories/appointmentRepository';
import { badRequest, notFound } from '../utils/errors';
import type { CreateAppointmentRequest, UpdateAppointmentStatusRequest } from '../types';

export async function listAppointments(filters?: {
  responsavelId?: number;
  veterinarianId?: number;
}) {
  return appointmentRepository.findAllAppointments(filters);
}

export async function getAppointment(id: number) {
  const item = await appointmentRepository.findAppointmentById(id);
  if (!item) throw notFound('Consulta não encontrada.');
  return item;
}

export async function createAppointment(data: CreateAppointmentRequest) {
  if (!data.animalId || !data.reason?.trim() || !data.dateTime) {
    throw badRequest('animalId, dateTime e reason são obrigatórios.');
  }
  return appointmentRepository.createAppointment(data);
}

export async function updateStatus(
  id: number,
  data: UpdateAppointmentStatusRequest
) {
  if (!data.status) throw badRequest('status é obrigatório.');
  const updated = await appointmentRepository.updateAppointmentStatus(
    id,
    data.status,
    data.veterinarianId
  );
  if (!updated) throw notFound('Consulta não encontrada.');
  return updated;
}
