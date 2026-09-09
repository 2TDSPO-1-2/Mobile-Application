import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listEspecies } from '../services/especieService';
import { listRacas, createRaca, type RacaDto, type RacaRequestInput } from '../services/racaService';
import { queryKeys } from '../query/queryKeys';

export function useEspecies() {
  return useQuery({
    queryKey: queryKeys.especies.list(),
    queryFn: listEspecies,
  });
}

export function useRacas(especieId: number | null) {
  return useQuery({
    queryKey: queryKeys.racas.byEspecie(especieId ?? -1),
    queryFn: () => listRacas(especieId as number),
    enabled: especieId != null,
  });
}

/**
 * Invalidates only the affected species' breed list — never every species'
 * breeds. The new breed is also written into that list's cache directly
 * (not just invalidated) BEFORE the invalidation-triggered refetch settles:
 * `PatientForm` auto-selects the new breed the instant this mutation
 * resolves, and its own "clear a breed that isn't in the current species'
 * list" effect would otherwise see the still-stale (pre-refetch) list,
 * decide the freshly-selected id doesn't belong, and immediately clear the
 * very selection this hook just made.
 */
export function useCreateRaca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RacaRequestInput) => createRaca(input),
    onSuccess: (created) => {
      const key = queryKeys.racas.byEspecie(created.especieId);
      queryClient.setQueryData<RacaDto[]>(key, (current) => (current ? [...current, created] : [created]));
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
