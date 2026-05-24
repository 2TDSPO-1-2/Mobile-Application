import type { Request, Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import type {
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from '../types';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    responsavelId: req.query.responsavelId
      ? Number(req.query.responsavelId)
      : undefined,
    veterinarianId: req.query.veterinarianId
      ? Number(req.query.veterinarianId)
      : undefined,
  };
  const items = await appointmentService.listAppointments(filters);
  res.json(items);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const item = await appointmentService.getAppointment(Number(req.params.id));
  res.json(item);
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await appointmentService.createAppointment(
    req.body as CreateAppointmentRequest
  );
  res.status(201).json(item);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const item = await appointmentService.updateStatus(
    Number(req.params.id),
    req.body as UpdateAppointmentStatusRequest
  );
  res.json(item);
}
