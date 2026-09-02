import { apiGet } from './apiClient';

/**
 * CONFIRMED against `DiagnosticoResponse.java`. `confirmado`/`validacaoVet`
 * are the two flags that distinguish a veterinarian-confirmed record
 * (`DiagnosticoService.criarConfirmadoPeloVeterinario`: confirmado="S",
 * validacaoVet="S", insightIa/confianca left null) from an AI-provisional
 * one (`criarSuporteClinicoIa`: confirmado="N", validacaoVet="N",
 * insightIa/confianca populated). A consultation can have both records once
 * finalized — never assume "the first one" is the right one; always filter
 * by `confirmado`.
 */
export interface DiagnosticoDto {
  id: number;
  diagnostico: string;
  severidade: string | null;
  confirmado: 'S' | 'N';
  insightIa: string | null;
  confianca: number | null;
  validacaoVet: 'S' | 'N';
  consultaId: number;
  doencaId: number | null;
}

/**
 * `GET /api/diagnosticos?consultaId=X` — confirmed scoped server-side per
 * role (`DiagnosticoService.listarAutorizado`). Also a Spring Data `Page`.
 */
export async function listDiagnosticosByConsulta(consultaId: number): Promise<DiagnosticoDto[]> {
  const page = await apiGet<{ content: DiagnosticoDto[] }>(
    `/api/diagnosticos?consultaId=${consultaId}`
  );
  return page.content;
}

/** The veterinarian's own confirmed conclusion for this consultation, if one has been recorded. */
export function findConfirmedDiagnosis(
  diagnosticos: DiagnosticoDto[]
): DiagnosticoDto | undefined {
  return diagnosticos.find((item) => item.confirmado === 'S');
}
