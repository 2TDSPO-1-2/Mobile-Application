import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User, UserRole } from '../types';
import type { RegisterData, UserContextValue } from '../interfaces/navigation';
import { findUserById, updateUser } from '../services/userService';
import {
  getSession,
  saveSession,
  clearSession,
} from '../services/sessionService';
import {
  loginWithApi,
  registerWithApi,
  getCachedCurrentUser,
} from '../services/authService';

export const AuthContext = createContext<UserContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      setUser(null);
      return;
    }
    const found = await findUserById(session.userId);
    setUser(found ?? null);
  }, []);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session) {
        const cached = await getCachedCurrentUser();
        if (cached?.autoLogin !== false && cached?.id === session.userId) {
          setUser(cached);
        } else if (session.userId) {
          const fromApi = await findUserById(session.userId);
          setUser(fromApi ?? cached ?? null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      role: UserRole,
      autoLogin = true
    ) => {
      const result = await loginWithApi(identifier, password, role, autoLogin);
      if (result.error || !result.user) {
        return result.error ?? 'Credenciais inválidas.';
      }
      await saveSession({
        userId: result.user.id,
        role: result.user.role,
        responsavelId: result.user.responsavelId,
        veterinarioId: result.user.veterinarioId,
        login: result.user.login,
      });
      setUser(result.user);
      return null;
    },
    []
  );

  const register = useCallback(async (data: RegisterData) => {
    const result = await registerWithApi(data);
    if (result.error || !result.user) {
      return result.error ?? 'Erro ao cadastrar.';
    }
    await saveSession({
      userId: result.user.id,
      role: result.user.role,
      responsavelId: result.user.responsavelId,
      veterinarioId: result.user.veterinarioId,
      login: result.user.login,
    });
    setUser(result.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      await updateUser({ ...user, autoLogin: false });
    }
    await clearSession();
    setUser(null);
  }, [user]);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
