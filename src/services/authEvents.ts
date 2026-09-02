/**
 * Tiny pub-sub so the generic transport layer (apiClient) can signal "the
 * stored session is no longer valid" without importing AuthContext or
 * React Navigation directly. apiClient -> emitUnauthorized(), AuthContext ->
 * onUnauthorized(). Neither module imports the other, so there is no
 * circular dependency between apiClient, AuthContext, and navigation.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitUnauthorized(): void {
  listeners.forEach((listener) => listener());
}
