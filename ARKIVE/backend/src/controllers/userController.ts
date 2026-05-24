import type { Request, Response } from 'express';
import * as userService from '../services/userService';

export async function list(_req: Request, res: Response): Promise<void> {
  const users = await userService.listUsers();
  res.json(users);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const user = await userService.getUser(Number(req.params.id));
  res.json(user);
}
