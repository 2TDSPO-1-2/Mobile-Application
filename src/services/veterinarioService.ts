import { apiGet } from './apiClient';

/**
 * Confirmed against `VeterinarioResponse.java`. There is still no dedicated
 * `/me`/`whoami` endpoint, but `GET /api/veterinarios/{id}` has no per-caller
 * ownership check (`VeterinarioController.buscarPorId` takes no
 * `UsuarioPrincipal`, and `SecurityConfig` only requires `/api/**` to be
 * `.authenticated()` — no role restriction) — so calling it with the
 * veterinarioId this app already resolves elsewhere (see
 * NewConsultaScreen.tsx's own confidence note) returns the authenticated
 * vet's own real record. No `telefone` field exists on this DTO at all —
 * never fabricate one.
 */
export interface VeterinarioDto {
  id: number;
  nome: string;
  crmv: string;
  especialidade: string | null;
  email: string;
  clinicaId: number | null;
  clinicaNome: string | null;
  ativo: 'S' | 'N';
}

export async function getVeterinarioById(id: number): Promise<VeterinarioDto> {
  return apiGet<VeterinarioDto>(`/api/veterinarios/${id}`);
}
