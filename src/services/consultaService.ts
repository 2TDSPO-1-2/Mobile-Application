import { apiDelete, apiGet, apiPost, apiPut } from './apiClient';

/** AG Agendada · EP Em Progresso · AP Aguardando Parecer · FI Finalizada · CA Cancelada */
export type ConsultaStatus = 'AG' | 'EP' | 'AP' | 'FI' | 'CA';

/**
 * PARTIALLY CONFIRMED SHAPE. `id` and `status` are backed by the documented
 * contract (the endpoint list and the AG/EP/AP/FI/CA workflow table).
 * `animalId`, `dataHora`, and `motivo` are best-effort — inferred from the
 * product brief's description of what a consultation should surface
 * (patient, date/time, reason) and from this schema's own Portuguese
 * camelCase convention (see AnimalDto in patientService.ts) — but they were
 * NOT verified against a live response: the Render instance did not respond
 * during this phase's implementation (two build phases, ~205s of combined
 * probing — see the Phase 2 report). The index signature keeps any other
 * real field readable instead of silently dropping it. The first time a
 * real payload is inspected, correct these names and delete this note.
 */
export interface ConsultaDto {
  id: number;
  status: ConsultaStatus;
  animalId?: number;
  dataHora?: string;
  motivo?: string;
  [key: string]: unknown;
}

/**
 * Fields this app sends when creating a consultation — deliberately narrow.
 * `veterinarioId` is intentionally NOT here: Spring Security identifies the
 * authenticated veterinarian from the Basic credential, and the product
 * brief is explicit that the mobile client must never supply/spoof that id.
 * Same confidence caveat as ConsultaDto above.
 */
export interface CreateConsultaInput {
  animalId: number;
  dataHora: string;
  motivo: string;
}

/** Only fields conservative enough to edit on an existing consultation without guessing at full-replace PUT semantics. */
export type UpdateConsultaInput = Partial<Pick<CreateConsultaInput, 'dataHora' | 'motivo'>>;

export async function listConsultas(): Promise<ConsultaDto[]> {
  return apiGet<ConsultaDto[]>('/api/consultas');
}

/**
 * Not itemized in the endpoint table the brief documents (only the
 * collection GET, POST, and by-id PUT/DELETE are listed there) — but a
 * by-id GET alongside by-id PUT/DELETE is the standard shape for this kind
 * of Spring REST controller, and a GET can't damage data if it turns out
 * unsupported. useConsulta() seeds from the list cache precisely so this
 * screen still works if this specific call 404s.
 */
export async function getConsulta(id: number): Promise<ConsultaDto> {
  return apiGet<ConsultaDto>(`/api/consultas/${id}`);
}

export async function createConsulta(input: CreateConsultaInput): Promise<ConsultaDto> {
  return apiPost<ConsultaDto>('/api/consultas', input);
}

export async function updateConsulta(
  id: number,
  patch: UpdateConsultaInput
): Promise<ConsultaDto> {
  return apiPut<ConsultaDto>(`/api/consultas/${id}`, patch);
}

export async function deleteConsulta(id: number): Promise<void> {
  await apiDelete<void>(`/api/consultas/${id}`);
}

/**
 * AG -> EP. No request body, matching the one workflow action the brief does
 * document the shape of (POST /suporte-clinico, "no request body") — the
 * new status must come from re-fetching the consultation afterward, never
 * from assuming this call succeeded and forcing 'EP' locally.
 */
export async function startConsulta(id: number): Promise<void> {
  await apiPost<void>(`/api/consultas/${id}/iniciar`);
}
