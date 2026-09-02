import { apiGet } from './apiClient';

/** AG Agendada · EP Em Progresso · AP Aguardando Parecer · FI Finalizada · CA Cancelada */
export type ConsultaStatus = 'AG' | 'EP' | 'AP' | 'FI' | 'CA';

/**
 * UNCONFIRMED SHAPE. Only `id` and `status` are backed by the documented
 * `/api/consultas` contract. The rest of the fields below are inferred from
 * the product brief's description of what a consultation should eventually
 * surface (patient, date/time, veterinarian, reason, narrative) — they have
 * NOT been verified against a live response, because no veterinarian
 * credential and no reachable backend were available to this session (the
 * Render instance did not respond during implementation — see the Phase 1
 * report). The index signature keeps unrecognized real fields readable
 * instead of silently dropping them. Replace the optional fields below with
 * confirmed ones — and remove this note — the first time a real payload is
 * inspected.
 */
export interface ConsultaDto {
  id: number;
  status: ConsultaStatus;
  animalId?: number;
  veterinarioId?: number;
  dataHora?: string;
  motivo?: string;
  narrativa?: string | null;
  [key: string]: unknown;
}

export async function listConsultas(): Promise<ConsultaDto[]> {
  return apiGet<ConsultaDto[]>('/api/consultas');
}
