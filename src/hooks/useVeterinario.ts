import { useQuery } from '@tanstack/react-query';
import { getVeterinarioById } from '../services/veterinarioService';
import { useConsultas } from './useConsultas';
import { queryKeys } from '../query/queryKeys';

/**
 * Resolves the authenticated veterinarian's own real profile (name, CRMV,
 * especialidade, email, clinic) for display — never fabricated.
 *
 * There's still no `/me` endpoint, so this reuses the same workaround
 * already established in NewConsultaScreen.tsx: `GET /api/consultas` is
 * scoped server-side to the authenticated vet, so any row in it carries
 * this account's real `veterinarioId`. That id is then used to fetch the
 * full record from `GET /api/veterinarios/{id}`.
 *
 * If this account has zero consultations yet, `veterinarioId` can't be
 * resolved this way — `data` stays `undefined` rather than guessing.
 */
export function useOwnVeterinario() {
  const { data: consultas, isPending: resolvingId } = useConsultas();
  const veterinarioId = consultas && consultas.length > 0 ? consultas[0].veterinarioId : null;

  const query = useQuery({
    queryKey: queryKeys.veterinarios.detail(veterinarioId ?? -1),
    queryFn: () => getVeterinarioById(veterinarioId as number),
    enabled: veterinarioId != null,
  });

  return {
    ...query,
    isPending: resolvingId || (veterinarioId != null && query.isPending),
    veterinarioId,
  };
}
