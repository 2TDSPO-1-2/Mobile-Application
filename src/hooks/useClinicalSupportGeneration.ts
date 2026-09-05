import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRequestClinicalSupport } from './useConsultas';
import { getClinicalSupport } from '../services/consultaService';
import { ApiError, isTransientInfraError } from '../services/apiClient';
import { describeClinicalSupportError } from '../utils/errorMessages';
import { queryKeys } from '../query/queryKeys';

export type GenerationPhase = 'idle' | 'analyzing' | 'error';

/**
 * Statuses the clinical engine's own cold-start/wake cycle can legitimately
 * produce and that must NOT read as a hard failure: 500/502/503/504 (engine
 * asleep/restarting/erroring transiently), a `NetworkError` (the request
 * itself never got a response), and 409 (`ClinicalSupportService.gerarSuporte`'s
 * `consultasEmProcessamento` guard — generation is already running,
 * possibly from an earlier attempt that timed out client-side). Everything
 * else (400/401/403/404/422/other validation-or-auth) is a real failure.
 */
function classifySupportError(err: unknown): { transient: boolean; processing: boolean } {
  if (err instanceof ApiError && err.status === 409) return { transient: true, processing: true };
  return { transient: isTransientInfraError(err), processing: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 409 means another attempt is already generating server-side — never POST
// again, just keep checking the safe read-only GET until it's done. This
// polls indefinitely (bounded only by the run/mounted guards below), because
// the server workflow is the source of truth and may still be working.
const POLL_INTERVAL_MS = 4500;

// 500/502/503/504/network means generation itself may not have completed —
// safe to retry the POST (one at a time, never overlapping), but only after
// confirming via GET that it didn't actually persist despite the error.
// Growing-then-capped backoff, no attempt limit: a cold engine can take
// longer than a handful of retries to wake up.
const RETRY_DELAY_MS = [4000, 6000, 8000, 10000];
const RETRY_DELAY_CAP_MS = 10000;
const SLOW_THRESHOLD_MS = 30000;

function retryDelayFor(attempt: number): number {
  return RETRY_DELAY_MS[attempt] ?? RETRY_DELAY_CAP_MS;
}

/**
 * Owns ONLY clinical-support generation + cold-start recovery for an
 * already-persisted consultation. Recovery is PERSISTENT, not bounded: for
 * transient infrastructure failures this never gives up on its own — it
 * keeps recovering for as long as the screen stays mounted and the run is
 * still current. It only ever reaches `error` phase for a genuine
 * non-transient failure (permission/validation/not-found).
 */
export function useClinicalSupportGeneration(consultaId: number) {
  const requestSupport = useRequestClinicalSupport(consultaId);
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Signals "this is taking longer than usual" without ending the analyzing
  // phase — purely informational, never a failure state.
  const [isSlow, setIsSlow] = useState(false);

  // Guards state updates against a screen that unmounted, or a newer run
  // that superseded this one. A pending setTimeout/mutation from an old run
  // still fires, but every continuation checks `isCurrent` before touching
  // state, so it's inert — this is also how "the user left" cleanly stops
  // every timer/loop without any extra bookkeeping.
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSlowTimer = useCallback(() => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearSlowTimer();
    };
  }, [clearSlowTimer]);

  const isCurrent = useCallback((runId: number) => mountedRef.current && runId === runIdRef.current, []);

  const finishSuccess = useCallback(() => {
    clearSlowTimer();
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.detail(consultaId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.consultas.clinicalSupport(consultaId) });
    setIsSlow(false);
    setPhase('idle');
    setErrorMessage(null);
  }, [consultaId, queryClient, clearSlowTimer]);

  const finishError = useCallback(
    (message: string) => {
      clearSlowTimer();
      setIsSlow(false);
      setPhase('error');
      setErrorMessage(message);
    },
    [clearSlowTimer]
  );

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
      while (isCurrent(runId)) {
        await sleep(POLL_INTERVAL_MS);
        if (!isCurrent(runId)) return;
        const found = await checkPersisted();
        if (!isCurrent(runId)) return;
        if (found) {
          finishSuccess();
          return;
        }
        // Not found yet — keep polling. Never falls back to finishError:
        // server workflow status is the source of truth here.
      }
    },
    [isCurrent, checkPersisted, finishSuccess]
  );

  const runGeneration = useCallback(
    async (runId: number) => {
      let attempt = 0;
      while (isCurrent(runId)) {
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

          // Engine-side failure (500/502/503/504/network): the POST may
          // still have persisted a result server-side despite us never
          // seeing a 200 — always check before assuming generation truly
          // failed, and before ever issuing another POST.
          const found = await checkPersisted();
          if (!isCurrent(runId)) return;
          if (found) {
            finishSuccess();
            return;
          }

          await sleep(retryDelayFor(attempt));
          attempt += 1;
          // Loop continues — persistent recovery, no attempt cap. Only
          // mount/run-id becoming stale (the user left, or a newer run
          // started) ever stops this.
        }
      }
    },
    [requestSupport, isCurrent, finishSuccess, finishError, pollUntilPersisted, checkPersisted]
  );

  const generate = useCallback(() => {
    // Guards against a double-invocation (e.g. a screen effect re-firing)
    // starting a second, concurrent generation run.
    if (phase === 'analyzing') return;
    setErrorMessage(null);
    setIsSlow(false);
    setPhase('analyzing');
    const runId = ++runIdRef.current;
    clearSlowTimer();
    slowTimerRef.current = setTimeout(() => {
      if (isCurrent(runId)) setIsSlow(true);
    }, SLOW_THRESHOLD_MS);
    void runGeneration(runId);
  }, [phase, runGeneration, isCurrent, clearSlowTimer]);

  return { phase, errorMessage, isSlow, generate };
}
