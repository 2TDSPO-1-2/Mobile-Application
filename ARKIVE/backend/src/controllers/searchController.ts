import type { Request, Response } from 'express';
import * as searchService from '../services/searchService';

export async function search(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? '');
  const type = req.query.type ? String(req.query.type) : undefined;
  const results = await searchService.search(q, type);
  res.json(results);
}
