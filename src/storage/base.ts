import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Never rejects — mirrors getJson's own defensive contract. Every current
 * caller either awaits this inside an already-try/caught function, or
 * fires it without awaiting at all (e.g. saving a non-critical UI
 * preference like the voice-dictation language). A storage write failure
 * for a harmless local preference is not worth surfacing to the user, and
 * an un-awaited rejection there would otherwise crash the app as an
 * unhandled promise rejection.
 */
export async function setJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* best-effort — see note above */
  }
}
