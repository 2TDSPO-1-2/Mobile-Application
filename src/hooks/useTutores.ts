import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { searchResponsaveis } from '../services/responsavelService';
import {
  linkTutor,
  listActiveTutorsByAnimal,
  type AnimalResponsavelRequestInput,
} from '../services/animalResponsavelService';
import { queryKeys } from '../query/queryKeys';

/** Minimum query length before hitting the backend — mirrors the search UI's own guard, kept here too so a caller can't bypass it by calling the hook directly with a short string. */
const MIN_QUERY_LENGTH = 2;

export function useSearchResponsaveis(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.responsaveis.search(trimmed),
    queryFn: () => searchResponsaveis(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
  });
}

/** Currently active tutor relationships for one patient — see `listActiveTutorsByAnimal`'s note on scope (active only, not full history). */
export function useAnimalTutores(animalId: number | null) {
  return useQuery({
    queryKey: queryKeys.animalResponsaveis.byAnimal(animalId ?? -1),
    queryFn: () => listActiveTutorsByAnimal(animalId as number),
    enabled: animalId != null,
  });
}

export function useLinkTutor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AnimalResponsavelRequestInput) => linkTutor(input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.animalResponsaveis.byAnimal(variables.animalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(variables.animalId) });
    },
  });
}
