import { apiGet } from './apiClient';

/**
 * CONFIRMED shape — matches the example payload given directly in the ArkIve
 * backend contract for GET /api/animais. `sexo` is typed loosely because
 * only "M" appeared in the documented example, not the full value set;
 * `castrado`/`ativo` follow the S/N convention used throughout this schema.
 */
export interface AnimalDto {
  id: number;
  nome: string;
  especieId: number;
  especieNome: string;
  racaId: number | null;
  racaNome: string | null;
  sexo: string;
  castrado: 'S' | 'N';
  clinicaId: number | null;
  ativo: 'S' | 'N';
}

/**
 * Whether this list is already scoped to the authenticated veterinarian (or
 * their clinic) is NOT documented anywhere in the available backend
 * contract, and could not be confirmed at runtime — the backend was
 * unreachable throughout this phase (see the Phase 2 report). Treat the
 * result as unscoped until the backend team confirms otherwise: any
 * client-side narrowing applied on top of this (e.g. a search box) is a
 * usability convenience, never an authorization boundary. Do not build
 * security logic on top of this call.
 */
export async function listPatients(): Promise<AnimalDto[]> {
  return apiGet<AnimalDto[]>('/api/animais');
}
