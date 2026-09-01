import type { User } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';
import { apiGet, isNetworkError } from './apiClient';
import { mapApiUserToUser, type ApiUserDto } from './apiMappers';
import { generateId } from '../utils/id';

export async function getUsers(): Promise<User[]> {
  try {
    const list = await apiGet<ApiUserDto[]>('/users');
    const users = list.map((u) => mapApiUserToUser(u));
    await setJson(STORAGE_KEYS.users, users);
    return users;
  } catch (error) {
    if (isNetworkError(error)) {
      return getJson<User[]>(STORAGE_KEYS.users, []);
    }
    throw error;
  }
}

export async function findUserById(id: string): Promise<User | undefined> {
  const cached = await getJson<User | null>(STORAGE_KEYS.currentUser, null);
  if (cached?.id === id) return cached;

  try {
    const api = await apiGet<ApiUserDto>(`/users/${id}`);
    const user = mapApiUserToUser(api);
    await upsertUserCache(user);
    return user;
  } catch (error) {
    if (isNetworkError(error)) {
      const users = await getJson<User[]>(STORAGE_KEYS.users, []);
      return users.find((u) => u.id === id);
    }
    return undefined;
  }
}

export async function findUserByCpf(cpf: string): Promise<User | undefined> {
  const digits = cpf.replace(/\D/g, '');
  const users = await getJson<User[]>(STORAGE_KEYS.users, []);
  return users.find((u) => u.cpf.replace(/\D/g, '') === digits);
}

export async function findUserByCrmv(crmv: string): Promise<User | undefined> {
  const users = await getJson<User[]>(STORAGE_KEYS.users, []);
  return users.find(
    (u) => u.role === 'veterinario' && u.crmv?.toUpperCase() === crmv.toUpperCase()
  );
}

export async function createUser(
  data: Omit<User, 'id' | 'createdAt'>
): Promise<User> {
  const users = await getJson<User[]>(STORAGE_KEYS.users, []);
  const user: User = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await setJson(STORAGE_KEYS.users, users);
  return user;
}

export async function updateUser(user: User): Promise<void> {
  await upsertUserCache(user);
  const current = await getJson<User | null>(STORAGE_KEYS.currentUser, null);
  if (current?.id === user.id) {
    await setJson(STORAGE_KEYS.currentUser, user);
  }
}

async function upsertUserCache(user: User): Promise<void> {
  const users = await getJson<User[]>(STORAGE_KEYS.users, []);
  const index = users.findIndex((u) => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  await setJson(STORAGE_KEYS.users, users);
}
