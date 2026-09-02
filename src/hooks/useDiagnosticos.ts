import { useQuery } from '@tanstack/react-query';
import { listDiagnosticosByConsulta } from '../services/diagnosticoService';
import { queryKeys } from '../query/queryKeys';

/** Gate `enabled` to `FI` consultations — there's no confirmed diagnosis to fetch before finalization. */
export function useConsultaDiagnosticos(consultaId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.diagnosticos.byConsulta(consultaId),
    queryFn: () => listDiagnosticosByConsulta(consultaId),
    enabled: options?.enabled ?? true,
  });
}
