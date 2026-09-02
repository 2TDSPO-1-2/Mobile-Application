import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './apiClient';

/** AG Agendada · EP Em Progresso · AP Aguardando Parecer · FI Finalizada · CA Cancelada */
export type ConsultaStatus = 'AG' | 'EP' | 'AP' | 'FI' | 'CA';

/** The only two values `ConsultaService.validarModalidadeObrigatoria` accepts. */
export type Modalidade = 'PRESENCIAL' | 'REMOTA';

/** The only values the veterinarian-authored severity fields accept (`FinalizarConsultaRequest`/`SalvarDiagnosticoRequest`). */
export type Severidade = 'LEVE' | 'MODERADA' | 'GRAVE';

/**
 * CONFIRMED against the ArkIve Spring Boot source (sibling project
 * `SPRINT-3/java-advanced`, `ConsultaResponse.java`) — every field here is a
 * direct match, not an inference.
 */
export interface ConsultaDto {
  id: number;
  dataHora: string;
  modalidade: Modalidade;
  motivo: string;
  sintomas: string | null;
  observacao: string | null;
  peso: number | null;
  transcricao: string | null;
  status: ConsultaStatus;
  statusDescricao: string;
  animalId: number;
  animalNome: string;
  veterinarioId: number;
  veterinarioNome: string;
  clinicaId: number | null;
  clinicaNome: string | null;
}

/** `ConsultaWorkflowResponse.java` — same fields as ConsultaDto plus the diagnosis created by `finalizar`, when applicable. */
export interface ConsultaWorkflowResponse extends ConsultaDto {
  diagnosticoId: number | null;
}

/**
 * `ConsultaRequest.java`, confirmed by the Postman collection's own example
 * body: `{ dataHora, modalidade, motivo, animalId, veterinarioId }`. Used
 * as-is for both create and update — Spring reuses the same record for
 * `POST /api/consultas` and `PUT /api/consultas/{id}`.
 *
 * `veterinarioId` IS required in the body (unlike this app's Phase 2
 * assumption) — but `ConsultaService.criar` rejects it with 409 unless it
 * equals the authenticated principal's own veterinarioId, so it can't be
 * spoofed to create a consultation for someone else. There is currently no
 * endpoint that lets the mobile client discover its own veterinarioId
 * directly (no `/me`/`/whoami` anywhere in the backend) — see
 * `NewConsultaScreen.tsx` for how this app works around that gap, and the
 * Phase 2.5 report for why a backend identity endpoint is the real fix.
 *
 * `status` is deliberately not a field here: the backend forces new
 * consultations to `AG` and rejects any PUT that changes status to
 * something else (`ConsultaService.validarStatusCriacaoOuAtualizacao`) — the
 * client should never send it either way.
 */
export interface ConsultaRequestInput {
  dataHora: string;
  modalidade: Modalidade;
  motivo: string;
  sintomas?: string;
  observacao?: string;
  peso?: number;
  transcricao?: string;
  animalId: number;
  veterinarioId: number;
}

export type CreateConsultaInput = ConsultaRequestInput;

/**
 * Same request shape as create, because Spring's PUT is a full replace, not
 * a patch (`ConsultaService.aplicarDados` is shared between create/update).
 * `animalId`/`veterinarioId` (and clinicaId, not exposed here) must match
 * the consultation's current values exactly — `exigirAssociacoesImutaveis`
 * returns 409 otherwise. Confirmed, but not wired to any screen this phase.
 */
export type UpdateConsultaInput = ConsultaRequestInput;

/** `AtualizarNarrativaConsultaRequest.java` — confirmed, not called yet (narrative editor is a future phase). */
export interface AtualizarNarrativaRequest {
  narrativa: string;
}

/**
 * `ClinicalSupportResponse.java`. `severidadeSugerida` is intentionally a
 * plain `string`: `ClinicalSupportService.validarResultado` only checks the
 * external engine's output is non-blank, it does NOT constrain it to the
 * LEVE/MODERADA/GRAVE set — unlike the veterinarian-authored `Severidade`
 * above, the AI's severity vocabulary is not confirmed.
 */
export interface ClinicalSupportResponse {
  consultaId: number;
  statusConsulta: ConsultaStatus;
  statusDescricao: string;
  hipoteseDiagnostica: string;
  severidadeSugerida: string;
  insightClinico: string;
  confianca: number | null;
}

/** `FinalizarConsultaRequest.java` — the veterinarian's conclusion, confirmed, not called yet. */
export interface FinalizarConsultaRequest {
  diagnostico: string;
  severidade?: Severidade;
  doencaId?: number | null;
  conclusao?: string;
}

/** `CancelarConsultaRequest.java` — confirmed, not called yet (no cancel action in this phase's UI). */
export interface CancelarConsultaRequest {
  motivo: string;
}

/** `GET /api/consultas` returns a Spring Data `Page`, not a bare array — unwrap `.content`. */
export async function listConsultas(): Promise<ConsultaDto[]> {
  const page = await apiGet<{ content: ConsultaDto[] }>('/api/consultas');
  return page.content;
}

/** Confirmed: `ConsultaController.buscarPorId`, `@GetMapping("/{id}")`. */
export async function getConsulta(id: number): Promise<ConsultaDto> {
  return apiGet<ConsultaDto>(`/api/consultas/${id}`);
}

export async function createConsulta(input: CreateConsultaInput): Promise<ConsultaDto> {
  return apiPost<ConsultaDto>('/api/consultas', input);
}

/** Full-replace PUT — see the confidence note on UpdateConsultaInput. Not called by any screen yet. */
export async function updateConsulta(
  id: number,
  input: UpdateConsultaInput
): Promise<ConsultaDto> {
  return apiPut<ConsultaDto>(`/api/consultas/${id}`, input);
}

/**
 * Confirmed backend rule (`ConsultaService.excluir`): only a consultation
 * still `AG` may be deleted — anything else returns 409. This is not a
 * client-side UX guess; enforce the same restriction in the UI so the
 * button doesn't invite a request the server will always reject.
 */
export async function deleteConsulta(id: number): Promise<void> {
  await apiDelete<void>(`/api/consultas/${id}`);
}

/** AG -> EP. No request body. Returns the updated consultation, but callers should still invalidate + refetch rather than trust this payload directly. */
export async function startConsulta(id: number): Promise<ConsultaWorkflowResponse> {
  return apiPost<ConsultaWorkflowResponse>(`/api/consultas/${id}/iniciar`);
}

/**
 * Confirmed: `GET /api/consultas/{id}/suporte-clinico` only reads whatever
 * was already persisted — `ClinicalSupportService.buscarSuporte` never calls
 * the external engine.
 */
export async function getClinicalSupport(id: number): Promise<ClinicalSupportResponse> {
  return apiGet<ClinicalSupportResponse>(`/api/consultas/${id}/suporte-clinico`);
}

/**
 * Confirmed: `ConsultaWorkflowService.atualizarNarrativa` accepts this while
 * the consultation is EP *or* AP, and stores the text on `Consulta.transcricao`
 * (the request field is called `narrativa`; the field holding the same text
 * on every response DTO is `transcricao` — not a naming mismatch, two
 * different DTOs for two different directions).
 *
 * Only ever call this from useConsultaWorkflow.ts, awaited to completion,
 * before requestClinicalSupport — never in parallel with it.
 */
export async function updateNarrativa(
  id: number,
  narrativa: string
): Promise<ConsultaWorkflowResponse> {
  return apiPatch<ConsultaWorkflowResponse>(`/api/consultas/${id}/narrativa`, { narrativa });
}

/**
 * POST, no request body — the backend reads the persisted consultation
 * directly from Oracle, so whatever narrative text is in the database at
 * call time is what the Clinical Engine sees. Never call this without
 * having already awaited a successful updateNarrativa for any new text.
 */
export async function requestClinicalSupport(id: number): Promise<ClinicalSupportResponse> {
  return apiPost<ClinicalSupportResponse>(`/api/consultas/${id}/suporte-clinico`);
}

/**
 * Confirmed: `ConsultaStatusTransitionPolicy` actually permits both `EP->FI`
 * and `AP->FI` server-side. This app deliberately only ever calls this from
 * `AP` — the intended ArkIve flow is narrative -> AI support -> veterinarian
 * conclusion, and skipping straight from EP would let a veterinarian
 * finalize a case IA never got a chance to look at. That's a product
 * choice enforced in ConsultaDetailScreen.tsx, not a backend limitation.
 *
 * `doencaId` is always sent as `null` from this app: there is no `/api/doencas`
 * (or equivalent) REST endpoint anywhere in the backend for a mobile client
 * to look one up, and DiagnosticoService confirms it's optional (nullable).
 * Never invent/hardcode a numeric doencaId.
 */
export async function finalizeConsulta(
  id: number,
  input: FinalizarConsultaRequest
): Promise<ConsultaWorkflowResponse> {
  return apiPost<ConsultaWorkflowResponse>(`/api/consultas/${id}/finalizar`, input);
}
