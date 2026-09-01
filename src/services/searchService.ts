import { apiGet, isNetworkError } from './apiClient';
import type { ApiSearchResult } from './apiMappers';

export interface SearchItem {
  type: ApiSearchResult['type'];
  id: string;
  title: string;
  subtitle: string;
}

export async function searchGlobal(
  term: string,
  type?: string
): Promise<SearchItem[]> {
  try {
    const params = new URLSearchParams({ q: term });
    if (type) params.set('type', type);
    const results = await apiGet<ApiSearchResult[]>(`/search?${params.toString()}`);
    return results.map((r) => ({
      type: r.type,
      id: String(r.id),
      title: r.title,
      subtitle: r.subtitle,
    }));
  } catch (error) {
    if (isNetworkError(error)) {
      return [];
    }
    throw error;
  }
}
