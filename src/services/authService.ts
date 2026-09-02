import { apiGet, ApiError, isNetworkError } from './apiClient';
import type { StoredCredentials } from '../storage/credentialStore';

export type CredentialVerificationResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'invalid' | 'forbidden' | 'unreachable' | 'unknown';
      message: string;
    };

/**
 * Spring Security exposes no dedicated /login endpoint — auth for /api/**
 * is plain HTTP Basic, checked independently on every request. So "logging
 * in" on the mobile app means: try a real protected request with the
 * credential pair and see whether Spring accepts it.
 *
 * GET /api/consultas is used as that probe because it's the one documented
 * endpoint squarely in the VETERINARIO operational flow this app serves.
 * This assumption is isolated to this one function on purpose — if the
 * backend team later points at a more appropriate identity/whoami endpoint,
 * only this function needs to change.
 */
export async function verifyCredentials(
  credentials: StoredCredentials
): Promise<CredentialVerificationResult> {
  try {
    await apiGet('/api/consultas', { authOverride: credentials });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return {
          ok: false,
          reason: 'invalid',
          message: 'Usuário ou senha inválidos.',
        };
      }

      if (error.status === 403) {
        return {
          ok: false,
          reason: 'forbidden',
          message: 'Este usuário não tem acesso ao aplicativo do veterinário.',
        };
      }

      return {
        ok: false,
        reason: 'unknown',
        message: 'Não foi possível validar suas credenciais agora. Tente novamente.',
      };
    }

    if (isNetworkError(error)) {
      return {
        ok: false,
        reason: 'unreachable',
        message:
          'Servidor indisponível no momento. O ArkIve pode estar iniciando — tente novamente em instantes.',
      };
    }

    return {
      ok: false,
      reason: 'unknown',
      message: 'Erro inesperado ao validar credenciais.',
    };
  }
}
