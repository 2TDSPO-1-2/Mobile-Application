import { apiGet } from './apiClient';

/**
 * CONFIRMED against the ArkIve Spring Boot source (sibling project
 * `SPRINT-3/java-advanced`, `AnimalResponse.java`). `sexo` is constrained to
 * `M`/`F` because `AnimalService.validarSexoQuandoInformado` rejects any
 * other value; `castrado`/`ativo` follow the same confirmed S/N convention.
 */
export interface AnimalDto {
  id: number;
  nome: string;
  especieId: number;
  especieNome: string;
  racaId: number | null;
  racaNome: string | null;
  sexo: 'M' | 'F';
  castrado: 'S' | 'N';
  clinicaId: number | null;
  clinicaNome: string | null;
  ativo: 'S' | 'N';
}

/**
 * CONFIRMED scoped server-side: `AnimalService.listarAutorizado`'s
 * VETERINARIO branch calls `animalRepository.buscarParaVeterinario(principal.getVeterinarioId(), ...)`,
 * returning only animals linked through that veterinarian's own
 * consultations — not every animal in the system. (Phase 2 had flagged this
 * as unconfirmed; it no longer is.) Confirmed separately: a VETERINARIO
 * cannot create/update/delete animals (`AnimalService.requestAutorizadoParaCriacao`
 * throws `AccessDeniedException` for that role) — this app's read-only
 * patient list matches the backend's own authorization model, not just a
 * client-side choice.
 *
 * `GET /api/animais` also returns a Spring Data `Page`, not a bare array.
 */
export async function listPatients(): Promise<AnimalDto[]> {
  const page = await apiGet<{ content: AnimalDto[] }>('/api/animais');
  return page.content;
}
