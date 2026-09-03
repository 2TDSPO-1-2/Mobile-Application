import { apiGet, apiPost, apiPut } from './apiClient';

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
  sexo: 'M' | 'F' | null;
  castrado: 'S' | 'N';
  clinicaId: number | null;
  clinicaNome: string | null;
  ativo: 'S' | 'N';
}

/**
 * `AnimalRequest.java` — `nome`/`especieId` are the only `@NotBlank`/`@NotNull`
 * fields; the same record backs both create and update, so update must also
 * send them in full (Spring re-validates the whole body, not a partial
 * patch). `clinicaId`/`ativo` are deliberately never sent from this app: for
 * an authenticated VETERINARIO, `AnimalService.requestAutorizadoParaCriacao`/
 * `requestAutorizadoParaAtualizacao` derive the clinic themselves and reject
 * any `clinicaId` that doesn't match it, force `ativo="S"` on create, and
 * reject any `ativo` change on update (409) — there is nothing correct this
 * app could send for either field.
 */
export interface AnimalRequestInput {
  nome: string;
  especieId: number;
  racaId?: number | null;
  sexo?: 'M' | 'F' | null;
  castrado?: 'S' | 'N' | null;
}

export interface ClinicPatientFilters {
  nome?: string;
  especieId?: number;
  racaId?: number;
}

/**
 * CONFIRMED scoped server-side: `AnimalService.listarAutorizado`'s
 * VETERINARIO branch calls `animalRepository.buscarParaVeterinario(principal.getVeterinarioId(), ...)`,
 * returning only animals linked through that veterinarian's own past
 * consultations — this is the "Já atendidos" scope, not the full clinic
 * registry. `GET /api/animais` returns a Spring Data `Page`, not a bare array.
 */
export async function listPatients(): Promise<AnimalDto[]> {
  const page = await apiGet<{ content: AnimalDto[] }>('/api/animais');
  return page.content;
}

/**
 * CONFIRMED: `AnimalController.listarPacientesClinica` / `AnimalService.listarPacientesClinicaVeterinario`
 * — active patients belonging to the authenticated veterinarian's own
 * clinic, with NO prior-consultation requirement. This is the correct
 * source for "start a first consultation with a patient I've never seen."
 */
export async function listClinicPatients(filters?: ClinicPatientFilters): Promise<AnimalDto[]> {
  const params = new URLSearchParams();
  if (filters?.nome) params.set('nome', filters.nome);
  if (filters?.especieId != null) params.set('especieId', String(filters.especieId));
  if (filters?.racaId != null) params.set('racaId', String(filters.racaId));
  const query = params.toString() ? `?${params.toString()}` : '';
  const page = await apiGet<{ content: AnimalDto[] }>(`/api/animais/clinica${query}`);
  return page.content;
}

/**
 * CONFIRMED: `AnimalService.buscarPorIdAutorizado` → `ClinicalAccessService.exigirLeituraAnimal`
 * allows a veterinarian to read an active same-clinic patient OR a patient
 * they've previously consulted — either way, a plain by-id GET.
 */
export async function getPatientById(id: number): Promise<AnimalDto> {
  return apiGet<AnimalDto>(`/api/animais/${id}`);
}

/**
 * CONFIRMED: `AnimalController.criar` now permits VETERINARIO
 * (`AnimalService.requestAutorizadoParaCriacao`'s VETERINARIO branch). The
 * backend derives the clinic from the authenticated veterinarian and forces
 * `ativo="S"` — this app sends neither field.
 */
export async function createPatient(input: AnimalRequestInput): Promise<AnimalDto> {
  return apiPost<AnimalDto>('/api/animais', input);
}

/**
 * CONFIRMED: `AnimalService.requestAutorizadoParaAtualizacao`'s VETERINARIO
 * branch permits updating basic metadata of an active same-clinic patient,
 * but rejects any `clinicaId`/`ativo` change (409) — never send either.
 */
export async function updatePatient(id: number, input: AnimalRequestInput): Promise<AnimalDto> {
  return apiPut<AnimalDto>(`/api/animais/${id}`, input);
}
