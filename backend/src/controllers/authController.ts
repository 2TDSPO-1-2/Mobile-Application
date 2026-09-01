import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { parseLoginBody, parseRegisterBody } from '../utils/authPayload';

export async function login(req: Request, res: Response): Promise<void> {
  const body = parseLoginBody(req.body as Record<string, unknown>);
  const user = await authService.login(body);
  res.json({ user });
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = parseRegisterBody(req.body as Record<string, unknown>);
  const user = await authService.register(body);
  res.status(201).json({ user });
}
