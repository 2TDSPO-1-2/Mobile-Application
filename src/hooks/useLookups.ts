import { useQuery } from '@tanstack/react-query';
import { listEspecies } from '../services/especieService';
import { listRacas } from '../services/racaService';
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
