import type { Request, Response } from 'express';
import * as evaluationService from '../services/evaluationService';
import type { CreateEvaluationRequest } from '../types';

export async function list(req: Request, res: Response): Promise<void> {
  const filters = {
    responsavelId: req.query.responsavelId
      ? Number(req.query.responsavelId)
      : undefined,
    veterinarianId: req.query.veterinarianId
      ? Number(req.query.veterinarianId)
      : undefined,
  };

  const items = await evaluationService.listEvaluations(filters);
  res.json(items);
}

export async function create(req: Request, res: Response): Promise<void> {
  const item = await evaluationService.createEvaluation(
    req.body as CreateEvaluationRequest
  );

  res.status(201).json(item);
}