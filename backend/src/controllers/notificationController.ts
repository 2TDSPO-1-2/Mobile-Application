import type { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    responsavelId: req.query.responsavelId
      ? Number(req.query.responsavelId)
      : undefined,
    clinicaId: req.query.clinicaId ? Number(req.query.clinicaId) : undefined,
  };
  const items = await notificationService.listNotifications(filters);
  res.json(items);
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const item = await notificationService.markAsRead(Number(req.params.id));
  res.json(item);
}
