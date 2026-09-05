import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * The only place in the app allowed to touch raw veterinarian credentials.
 * Every other module (apiClient, AuthContext, screens) goes through
 * save/get/clearCredentials and never sees the backing store directly.
 *
 * Native: `expo-secure-store` (Keychain/Keystore) — unchanged.
 *
 * Web: `localStorage`. Expo Web is deployed on Vercel now, so a session must
 * survive a page reload/browser restart — the previous memory-only behavior
 * silently logged the veterinarian out on every refresh. There is no
 * Keychain-equivalent on web, so this is the same trade-off every Basic-Auth
 * web client makes: the browser must retain the credential to reconstruct
 * the `Authorization` header on each request. `localStorage` (not
 * `sessionStorage`) is deliberate — it must survive closing and reopening
 * the browser, not just a reload within the same tab session.
 *
 * The in-memory fallback below is used ONLY when `localStorage` itself is
 * unavailable or throws (private-browsing storage restrictions, disabled
 * storage, quota exceeded) — never as the primary web path.
 */
export interface StoredCredentials {
  username: string;
  password: string;
}

const CREDENTIALS_KEY = 'arkive.auth.credentials';
const isWeb = Platform.OS === 'web';

let memoryFallbackCredentials: StoredCredentials | null = null;

function isValidStoredCredentials(value: unknown): value is StoredCredentials {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.username === 'string' &&
    candidate.username.length > 0 &&
    typeof candidate.password === 'string' &&
    candidate.password.length > 0
  );
}

/** Guards against `localStorage` throwing merely on *access* (not just on `.getItem`/`.setItem`) in some locked-down browser contexts. */
function getWebStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
  if (!isWeb) {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
    return;
  }

  const storage = getWebStorage();
  if (!storage) {
    memoryFallbackCredentials = credentials;
    return;
  }

  try {
    storage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    memoryFallbackCredentials = null;
  } catch {
    // Quota exceeded / storage disabled — degrade to memory rather than
    // silently losing the session for the current tab.
    memoryFallbackCredentials = credentials;
  }
}

export async function getCredentials(): Promise<StoredCredentials | null> {
  if (!isWeb) {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (isValidStoredCredentials(parsed)) return parsed;
    } catch {
      /* malformed JSON — falls through to cleanup below */
    }

    // Malformed/invalid stored value — never keep returning garbage.
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return null;
  }

  const storage = getWebStorage();
  if (!storage) {
    return memoryFallbackCredentials;
  }

  let raw: string | null;
  try {
    raw = storage.getItem(CREDENTIALS_KEY);
  } catch {
    return memoryFallbackCredentials;
  }
  if (!raw) return memoryFallbackCredentials;

  try {
    const parsed = JSON.parse(raw);
    if (isValidStoredCredentials(parsed)) return parsed;
  } catch {
    /* malformed JSON */
  }

  try {
    storage.removeItem(CREDENTIALS_KEY);
  } catch {
    /* best-effort */
  }
  return null;
}

export async function clearCredentials(): Promise<void> {
  memoryFallbackCredentials = null;

  if (!isWeb) {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    return;
  }

  const storage = getWebStorage();
  if (!storage) return;
  try {
    storage.removeItem(CREDENTIALS_KEY);
  } catch {
    /* best-effort */
  }
}
