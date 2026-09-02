import { useQuery } from '@tanstack/react-query';
import { listConsultas } from '../services/consultaService';
import { queryKeys } from '../query/queryKeys';

/**
 * Proves the intended architecture end-to-end — screen -> hook -> TanStack
 * Query -> service -> apiClient -> Spring Boot — without yet building the
 * full consultation feature (no detail view, no create/update, no patient
 * name resolution). That's deliberately deferred to the next phase.
 */
export function useConsultas() {
  return useQuery({
    queryKey: queryKeys.consultas.list(),
    queryFn: listConsultas,
  });
}
