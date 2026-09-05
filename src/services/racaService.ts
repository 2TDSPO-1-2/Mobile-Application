import { apiGet } from './apiClient';

/** Confirmed: `RacaResponse.java`. */
export interface RacaDto {
  id: number;
  nome: string;
  porte: string | null;
  especieId: number;
  especieNome: string;
  ativo: 'S' | 'N';
}

/**
 * `GET /api/racas` — confirmed to support `especieId` filtering server-side
 * (`RacaController.listar` / `RacaService.listar`), so the breed picker only
 * ever loads breeds that actually belong to the selected species instead of
 * a client-side filter over every breed in the system.
 */
export async function listRacas(especieId: number): Promise<RacaDto[]> {
  const page = await apiGet<{ content: RacaDto[] }>(
    `/api/racas?especieId=${especieId}&size=200`
  );
  return page.content;
}
