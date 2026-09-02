import { API_BASE_URL } from '../config/api';
import { encodeBase64 } from '../utils/base64';
import { getCredentials, type StoredCredentials } from '../storage/credentialStore';
import { emitUnauthorized } from './authEvents';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Sem conexão com o servidor.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || error instanceof TypeError;
}

function buildBasicAuthHeader({ username, password }: StoredCredentials): string {
  return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /**
   * Verify a credential pair that hasn't been persisted yet (used only by
   * the login probe in authService.verifyCredentials). Normal authenticated
   * traffic must never pass this — it always reads from credentialStore.
   */
  authOverride?: StoredCredentials;
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, authOverride, headers: extraHeaders, ...rest } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string> | undefined),
  };

  const credentials = authOverride ?? (await getCredentials());
  if (credentials) {
    headers.Authorization = buildBasicAuthHeader(credentials);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    let message = response.statusText || `Erro ${response.status}`;
    try {
      // Confirmed live shape from the real backend's error body:
      // {"timestamp":...,"status":401,"error":"Unauthorized","message":"Autenticacao obrigatoria.","path":...}
      // `message` carries the specific, human-actionable text; `error` is
      // just the generic HTTP reason phrase — prefer `message`.
      const parsed = (await response.json()) as { error?: string; message?: string };
      message = parsed.message ?? parsed.error ?? message;
    } catch {
      /* body wasn't JSON — keep the fallback message */
    }

    if (response.status === 401 && !authOverride) {
      // A 401 on a request that used the *stored* credential means the
      // session Spring Security accepted before is no longer valid (password
      // changed, account disabled, ...). A 401 during the login probe
      // (authOverride set) is an expected, locally-handled outcome instead —
      // it must not trigger a global sign-out of an already-authenticated user.
      emitUnauthorized();
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body });
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'PUT', body });
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body });
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
