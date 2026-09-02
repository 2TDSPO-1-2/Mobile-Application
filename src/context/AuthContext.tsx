import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthContextValue, AuthStatus } from '../interfaces/navigation';
import type { User } from '../types';
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  type StoredCredentials,
} from '../storage/credentialStore';
import { verifyCredentials } from '../services/authService';
import { onUnauthorized } from '../services/authEvents';
import { queryClient } from '../query/queryClient';

export const AuthContext = createContext<AuthContextValue | null>(null);

function toLegacyUser(username: string): User {
  return {
    id: username,
    name: username,
    email: '',
    phone: '',
    cpf: '',
    role: 'veterinario',
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [username, setUsername] = useState<string | null>(null);
  const credentialsRef = useRef<StoredCredentials | null>(null);

  const applyAuthenticated = useCallback((credentials: StoredCredentials) => {
    credentialsRef.current = credentials;
    setUsername(credentials.username);
    setStatus('authenticated');
  }, []);

  const applySignedOut = useCallback(async () => {
    credentialsRef.current = null;
    setUsername(null);
    await clearCredentials();
    // Prevents a veterinarian who just logged out (or was logged out by a
    // 401) from briefly seeing the previous account's cached server data.
    queryClient.clear();
    setStatus('unauthenticated');
  }, []);

  const restoreSession = useCallback(async () => {
    const stored = await getCredentials();
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }

    const result = await verifyCredentials(stored);
    if (result.ok) {
      applyAuthenticated(stored);
      return;
    }

    if (result.reason === 'unreachable' || result.reason === 'unknown') {
      // A cold backend or a transient failure must never be treated as "the
      // stored password is wrong" — keep the credential and let the UI retry.
      credentialsRef.current = stored;
      setUsername(stored.username);
      setStatus('unreachable');
      return;
    }

    // 'invalid' or 'forbidden': the credential is confirmed no longer good.
    await applySignedOut();
  }, [applySignedOut, applyAuthenticated]);

  useEffect(() => {
    restoreSession();
    // Intentionally runs once on mount only — subsequent revalidation goes
    // through refreshUser()/login(), not this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onUnauthorized(() => {
    applySignedOut();
  }), [applySignedOut]);

  const login = useCallback(
    async (rawUsername: string, rawPassword: string): Promise<string | null> => {
      const trialCredentials: StoredCredentials = {
        username: rawUsername.trim(),
        password: rawPassword,
      };

      if (!trialCredentials.username || !trialCredentials.password) {
        return 'Preencha usuário e senha.';
      }

      const result = await verifyCredentials(trialCredentials);
      if (!result.ok) {
        return result.message;
      }

      await saveCredentials(trialCredentials);
      applyAuthenticated(trialCredentials);
      return null;
    },
    [applyAuthenticated]
  );

  const logout = useCallback(async () => {
    await applySignedOut();
  }, [applySignedOut]);

  const refreshUser = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      username,
      user: username ? toLegacyUser(username) : null,
      role: username ? 'veterinario' : null,
      loading: status === 'initializing',
      login,
      logout,
      refreshUser,
    }),
    [status, username, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
