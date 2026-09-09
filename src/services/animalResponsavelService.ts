import { apiGet, apiPost } from './apiClient';

/**
 * CONFIRMED exhaustive set (`AnimalResponsavelService.TIPOS_VINCULO`) — the
 * backend rejects anything else with "Tipo de vinculo invalido." Never
 * invent a value like a bare "TUTOR"; the closest accepted concept to "the
 * patient's tutor" is `TUTOR_LEGAL`, used by every caller in this app.
 */
export type TipoVinculo =
  | 'TUTOR_LEGAL'
  | 'CUIDADOR'
  | 'RESPONSAVEL_CLINICO'
  | 'RESPONSAVEL_OPERACIONAL'
  | 'CONTATO_EMERGENCIA';

/** `AnimalResponsavelResponse.java`. */
export interface AnimalResponsavelDto {
  animalId: number;
  animalNome: string;
  responsavelId: number;
  responsavelNome: string;
  tipoVinculo: TipoVinculo;
  dataInicio: string;
  dataFim: string | null;
  principal: 'S' | 'N';
  ativo: 'S' | 'N';
}

/**
 * `AnimalResponsavelRequest.java`. `dataInicio` is left unset on create — the
 * backend defaults it to "today" itself (`AnimalResponsavelService.criar`).
 * `principal: 'S'` is sent explicitly so this becomes the patient's principal
 * tutor; the backend (`ajustarOutrosPrincipais`) automatically demotes any
 * previously-principal tutor for the same animal to `principal: 'N'` — it
 * stays on record (not deleted, not "encerrado"), so linking a new principal
 * tutor never destroys relationship history.
 */
export interface AnimalResponsavelRequestInput {
  animalId: number;
  responsavelId: number;
  tipoVinculo: TipoVinculo;
  dataInicio?: string;
  dataFim?: string | null;
  principal?: 'S' | 'N';
  ativo?: 'S' | 'N';
}

/**
 * `GET /api/animais-responsaveis/animal/{animalId}` — CONFIRMED to return
 * only CURRENTLY ACTIVE relationships as a plain array, not a `Page`
 * (`AnimalResponsavelService.listarAtivosPorAnimal`: `ativo='S'`,
 * `dataInicio` not in the future, `dataFim` null or not yet passed).
 */
export async function listActiveTutorsByAnimal(animalId: number): Promise<AnimalResponsavelDto[]> {
  return apiGet<AnimalResponsavelDto[]>(`/api/animais-responsaveis/animal/${animalId}`);
}

/**
 * `POST /api/animais-responsaveis`. Used both right after patient creation
 * (linking the tutor picked during registration) and from patient edit
 * (linking/replacing the principal tutor) — the backend's own
 * `ajustarOutrosPrincipais` handles the "replace" case correctly either way.
 */
export async function linkTutor(input: AnimalResponsavelRequestInput): Promise<AnimalResponsavelDto> {
  return apiPost<AnimalResponsavelDto>('/api/animais-responsaveis', input);
}
