import type { Request, Response } from 'express';
import * as feedbackService from '../services/feedbackService';
import type { CreateFeedbackRequest } from '../types';

export async function list(_req: Request, res: Response): Promise<void> {
  const items = await feedbackService.listFeedbacks();
  res.json(items);
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await feedbackService.createFeedback(req.body as CreateFeedbackRequest);
  res.status(201).json(item);
}
