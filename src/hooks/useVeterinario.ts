import { useQuery } from '@tanstack/react-query';
import { getVeterinarioById } from '../services/veterinarioService';
import { useAuth } from './useAuth';
import { queryKeys } from '../query/queryKeys';

/**
 * Resolves the authenticated veterinarian's own real profile (name, CRMV,
 * especialidade, email, clinic) for display — never fabricated.
 *
 * `veterinarioId` comes directly from `GET /api/auth/me` (via `AuthContext`'s
 * `identity`) — confirmed always resolvable for an authenticated VETERINARIO
 * regardless of consultation history. This replaces the old workaround that
 * inferred it from `GET /api/consultas[0].veterinarioId`, which left a
 * brand-new, zero-consultation veterinarian's own profile permanently
 * unresolvable.
 */
export function useOwnVeterinario() {
  const { identity } = useAuth();
  const veterinarioId = identity?.veterinarioId ?? null;

  const query = useQuery({
    queryKey: queryKeys.veterinarios.detail(veterinarioId ?? -1),
    queryFn: () => getVeterinarioById(veterinarioId as number),
    enabled: veterinarioId != null,
  });

  return {
    ...query,
    isPending: veterinarioId == null || query.isPending,
    veterinarioId,
  };
}
