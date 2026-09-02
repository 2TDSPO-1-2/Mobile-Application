import { useCallback } from 'react';
import { useRequestClinicalSupport, useSaveNarrativa } from './useConsultas';

/**
 * The one place that owns the save-then-AI sequence, so it exists exactly
 * once instead of being re-implemented per screen. `requestClinicalSupportFromDraft`
 * is two sequential `await`s in a single async function — there is no
 * `Promise.all`, no fire-and-forget `.mutate()`, and no branch that reaches
 * `requestSupport` without `saveNarrativa`'s promise having already resolved.
 * If the save rejects, the `await` throws and this function returns without
 * ever calling `requestSupport.mutateAsync`.
 */
export function useConsultaWorkflow(consultaId: number) {
  const saveNarrativa = useSaveNarrativa(consultaId);
  const requestSupport = useRequestClinicalSupport(consultaId);

  const requestClinicalSupportFromDraft = useCallback(
    async (narrativa: string) => {
      await saveNarrativa.mutateAsync(narrativa);
      return requestSupport.mutateAsync();
    },
    [saveNarrativa, requestSupport]
  );

  return {
    saveNarrativa,
    requestSupport,
    requestClinicalSupportFromDraft,
    isOrchestrating: saveNarrativa.isPending || requestSupport.isPending,
  };
}
