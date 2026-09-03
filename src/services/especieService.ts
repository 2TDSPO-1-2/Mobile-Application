import { apiGet } from './apiClient';

/** Confirmed: `EspecieResponse.java`. */
export interface EspecieDto {
  id: number;
  nome: string;
  ativo: 'S' | 'N';
}

/**
 * `GET /api/especies` returns a Spring Data `Page` (default size 20). Species
 * are a small, finite lookup table for a form picker, so this asks for a
 * generously large page rather than risk silently truncating the list.
 */
export async function listEspecies(): Promise<EspecieDto[]> {
  const page = await apiGet<{ content: EspecieDto[] }>('/api/especies?size=200');
  return page.content;
}
