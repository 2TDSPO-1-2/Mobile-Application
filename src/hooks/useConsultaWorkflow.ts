import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestClinicalSupport, useSaveNarrativa } from './useConsultas';
import { getClinicalSupport } from '../services/consultaService';
import { ApiError, isNetworkError } from '../services/apiClient';
import { describeClinicalSupportError } from '../utils/errorMessages';
import { queryKeys } from '../query/queryKeys';

export type SupportPhase = 'idle' | 'analyzing' | 'error';

/**
 * Statuses the Render clinical engine's own cold-start/wake cycle can
 * legitimately produce and that must NOT immediately read as a hard failure:
 * 502/503/504 (engine asleep/restarting), a `NetworkError` (the request
 * itself never got a response), and 409 (`ClinicalSupportService.gerarSuporte`'s
 * `consultasEmProcessamento` guard — generation is already running, possibly
 * from an earlier attempt this same screen made before timing out).
 */
function classifySupportError(err: unknown): { transient: boolean; processing: boolean } {
  if (err instanceof ApiError) {
    if (err.status === 409) return { transient: true, processing: true };
    if (err.status === 502 || err.status === 503 || err.status === 504) {
      return { transient: true, processing: false };
    }
    return { transient: false, processing: false };
  }
  if (isNetworkError(err)) return { transient: true, processing: false };
  return { transient: false, processing: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 409 means another attempt is already generating server-side — just keep
// checking the safe read-only GET until it's done rather than posting again.
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_ATTEMPTS = 20; // ~80s of polling

// 502/503/504/network means generation itself didn't complete — safe to
// retry the POST, but only a bounded number of times, and only after
// confirming (via GET) that it didn't actually persist despite the error.
const RETRY_DELAY_MS = [4000, 7000];
const MAX_RETRY_ATTEMPTS = RETRY_DELAY_MS.length; // up to 3 total POST attempts

/**
 * The one place that owns the save-then-AI sequence, so it exists exactly
 * once instead of being re-implemented per screen. `requestClinicalSupportFromDraft`
 * is two sequential `await`s — there is no `Promise.all`, no fire-and-forget
 * `.mutate()`, and no branch that reaches generation without `saveNarrativa`'s
 * promise having already resolved. If the save rejects, the `await` throws
 * and this function returns without ever attempting generation.
 *
 * On top of that invariant, this hook also owns the cold-start recovery
 * state machine for the generation step itself (see `supportPhase`): a
 * transient failure (Render waking up) keeps the caller in the `analyzing`
 * phase while it checks the persisted result and/or retries, instead of
 * surfacing a scary error the instant Java returns a temporary 5xx.
 */
export function useConsultaWorkflow(consultaId: number) {
  const saveNarrativa = useSaveNarrativa(consultaId);
  const requestSupport = useRequestClinicalSupport(consultaId);
  const queryClient = useQueryClient();

  const [supportPhase, setSupportPhase] = useState<SupportPhase>('idle');
  const [supportErrorMessage, setSupportErrorMessage] = useState<string | null>(null);

  // Guards state updates against a screen that unmounted, or a newer run
  // that superseded this one (e.g. the user backed out and came back). A
  // pending setTimeout/mutation from an old run still fires, but every
  // continuation checks `isCurrent` before touching state, so it's inert.
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isCurrent = useCallback((runId: number) => mountedRef.current && runId === runIdRef.current, []);

  const finishSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.detail(consultaId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.clinicalSupport(consultaId) });
    setSupportPhase('idle');
    setSupportErrorMessage(null);
  }, [consultaId, queryClient]);

  const finishError = useCallback((message: string) => {
    setSupportPhase('error');
    setSupportErrorMessage(message);
  }, []);

  /** Read-only recovery check — never triggers generation (confirmed: `buscarSuporte` never calls the external engine). */
  const checkPersisted = useCallback(async (): Promise<boolean> => {
    try {
      await getClinicalSupport(consultaId);
      return true;
    } catch {
      return false;
    }
  }, [consultaId]);

  const pollUntilPersisted = useCallback(
    async (runId: number) => {
      for (let attempt = 0; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
        await sleep(POLL_INTERVAL_MS);
        if (!isCurrent(runId)) return;
        const found = await checkPersisted();
        if (!isCurrent(runId)) return;
        if (found) {
          finishSuccess();
          return;
        }
      }
      if (isCurrent(runId)) {
        finishError('A análise está demorando mais que o esperado. Tente novamente em instantes.');
      }
    },
    [isCurrent, checkPersisted, finishSuccess, finishError]
  );

  const runGeneration = useCallback(
    async (runId: number) => {
      for (let attempt = 0; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        if (!isCurrent(runId)) return;

        try {
          await requestSupport.mutateAsync();
          if (!isCurrent(runId)) return;
          finishSuccess();
          return;
        } catch (err) {
          if (!isCurrent(runId)) return;

          const { transient, processing } = classifySupportError(err);

          if (!transient) {
            finishError(describeClinicalSupportError(err));
            return;
          }

          if (processing) {
            await pollUntilPersisted(runId);
            return;
          }

          // Engine-side failure (502/503/504/network): the POST may still
          // have persisted a result server-side despite us never seeing a
          // 200 — check before assuming generation truly failed.
          const found = await checkPersisted();
          if (!isCurrent(runId)) return;
          if (found) {
            finishSuccess();
            return;
          }

          if (attempt >= MAX_RETRY_ATTEMPTS) {
            finishError('O serviço de apoio clínico está indisponível no momento. Tente novamente em instantes.');
            return;
          }

          await sleep(RETRY_DELAY_MS[attempt] ?? RETRY_DELAY_MS[RETRY_DELAY_MS.length - 1]);
          // loop continues to the next attempt
        }
      }
    },
    [requestSupport, isCurrent, finishSuccess, finishError, pollUntilPersisted, checkPersisted]
  );

  const requestClinicalSupportFromDraft = useCallback(
    async (narrativa: string) => {
      // Defensive double-guard: the screen also disables the button while
      // `supportPhase === 'analyzing'`, but a stray double-tap must never
      // start a second, concurrent orchestration run.
      if (supportPhase === 'analyzing') return;

      setSupportErrorMessage(null);
      setSupportPhase('analyzing');
      const runId = ++runIdRef.current;

      try {
        await saveNarrativa.mutateAsync(narrativa);
      } catch (err) {
        // The narrative-save failure already has its own dedicated UI in
        // ConsultaDetailScreen (`saveNarrativa.isError`) — don't duplicate it
        // through supportPhase, just fall back out of the "analyzing" state.
        if (isCurrent(runId)) setSupportPhase('idle');
        throw err;
      }

      if (!isCurrent(runId)) return;
      await runGeneration(runId);
    },
    [saveNarrativa, supportPhase, isCurrent, runGeneration]
  );

  return {
    saveNarrativa,
    requestSupport,
    requestClinicalSupportFromDraft,
    supportPhase,
    supportErrorMessage,
    isOrchestrating: saveNarrativa.isPending || supportPhase === 'analyzing',
  };
}
