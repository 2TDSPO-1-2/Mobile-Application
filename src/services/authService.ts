import { apiPost, ApiError, isNetworkError } from './apiClient';
import { mapApiUserToUser, type ApiUserDto } from './apiMappers';
import type { User, UserRole } from '../types';
import type { RegisterData } from '../interfaces/navigation';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';

export async function loginWithApi(
  identifier: string,
  password: string,
  role: UserRole,
  autoLogin: boolean
): Promise<{ user: User | null; error: string | null; offline: boolean }> {
  const id = identifier.trim();
  const pwd = password.trim();

  if (!id || !pwd) {
    return { user: null, error: 'Preencha CPF/CRMV e senha.', offline: false };
  }

  try {
    const response = await apiPost<{ user: ApiUserDto }>('/auth/login', {
      role,
      identifier: id,
      password: pwd,
    });
    const user = mapApiUserToUser(response.user, { autoLogin });
    await cacheCurrentUser(user);
    return { user, error: null, offline: false };
  } catch (error) {
    if (error instanceof ApiError) {
      return { user: null, error: error.message, offline: false };
    }
    if (isNetworkError(error)) {
      return {
        user: null,
        error: 'Sem conexão com o servidor. Verifique a API em http://localhost:3333',
        offline: true,
      };
    }
    return { user: null, error: 'Erro ao entrar.', offline: false };
  }
}

export async function registerWithApi(
  data: RegisterData
): Promise<{ user: User | null; error: string | null; offline: boolean }> {
  const role: UserRole = data.isVeterinarian ? 'veterinario' : 'tutor';
  const cpf = data.cpf.replace(/\D/g, '');
  const password = data.password.trim();

  if (!data.name.trim() || !password) {
    return { user: null, error: 'Nome e senha são obrigatórios.', offline: false };
  }
  if (!cpf) {
    return { user: null, error: 'CPF é obrigatório.', offline: false };
  }
  if (role === 'veterinario' && !data.crmv?.trim()) {
    return { user: null, error: 'CRMV é obrigatório.', offline: false };
  }

  try {
    const response = await apiPost<{ user: ApiUserDto }>('/auth/register', {
      role,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password,
      cpf,
      crmv: data.isVeterinarian ? data.crmv!.trim() : undefined,
    });
    const user = mapApiUserToUser(response.user, {
      autoLogin: data.autoLogin ?? true,
    });
    await cacheCurrentUser(user);
    return { user, error: null, offline: false };
  } catch (error) {
    if (error instanceof ApiError) {
      return { user: null, error: error.message, offline: false };
    }
    if (isNetworkError(error)) {
      return {
        user: null,
        error: 'Sem conexão. Cadastro requer API ativa.',
        offline: true,
      };
    }
    return { user: null, error: 'Erro ao cadastrar.', offline: false };
  }
}

export async function cacheCurrentUser(user: User): Promise<void> {
  await setJson(STORAGE_KEYS.currentUser, user);
  const users = await getJson<User[]>(STORAGE_KEYS.users, []);
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  await setJson(STORAGE_KEYS.users, users);
}

export async function getCachedCurrentUser(): Promise<User | null> {
  return getJson<User | null>(STORAGE_KEYS.currentUser, null);
}
