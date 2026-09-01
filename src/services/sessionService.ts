import type { Session } from '../types';
import { getJson, setJson } from '../storage/base';
import { STORAGE_KEYS } from '../storage/keys';

export async function getSession(): Promise<Session | null> {
  return getJson<Session | null>(STORAGE_KEYS.session, null);
}

export async function saveSession(session: Session): Promise<void> {
  await setJson(STORAGE_KEYS.session, session);
}

export async function clearSession(): Promise<void> {
  await setJson(STORAGE_KEYS.session, null);
}
