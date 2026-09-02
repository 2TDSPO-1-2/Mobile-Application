import { QueryClient } from '@tanstack/react-query';

/**
 * Single application-wide QueryClient (created once, at module scope — never
 * inside a component). Query defaults tolerate a cold Render instance with a
 * couple of backed-off retries; mutation defaults never retry, because
 * ArkIve mutations are either non-idempotent (POST) or, in the case of the
 * future AI "suporte-clinico" request, must never be silently repeated.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
