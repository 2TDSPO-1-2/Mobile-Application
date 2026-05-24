import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : 'Erro interno do servidor.';
  res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
}
