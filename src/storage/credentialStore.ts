import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * The only place in the app allowed to touch raw veterinarian credentials.
 * Every other module (apiClient, AuthContext, screens) goes through
 * save/get/clearCredentials and never sees SecureStore directly.
 *
 * Web has no OS-level secure storage (no Keychain/Keystore equivalent), and
 * expo-secure-store has no real backing store there. Rather than fall back to
 * localStorage/AsyncStorage — which would silently defeat the point of this
 * module — credentials on web live only in memory for the current tab and are
 * never written to disk. That means the persisted-session-after-reload
 * requirement is a native-only guarantee for now; web users re-authenticate
 * on every page load. This is a deliberate, documented trade-off, not an
 * oversight (see the Phase 1 report).
 */
export interface StoredCredentials {
  username: string;
  password: string;
}

const CREDENTIALS_KEY = 'arkive.auth.credentials';
const isSecureStoreSupported = Platform.OS !== 'web';

let memoryOnlyCredentials: StoredCredentials | null = null;

export async function saveCredentials(credentials: StoredCredentials): Promise<void> {
  if (!isSecureStoreSupported) {
    memoryOnlyCredentials = credentials;
    return;
  }
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export async function getCredentials(): Promise<StoredCredentials | null> {
  if (!isSecureStoreSupported) {
    return memoryOnlyCredentials;
  }

  const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  if (!isSecureStoreSupported) {
    memoryOnlyCredentials = null;
    return;
  }
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}
