import { apiGet } from './apiClient';

/**
 * `ResponsavelLookupResponse.java` — CONFIRMED this is the ENTIRE shape
 * `GET /api/responsaveis/busca` returns (`id`, `nome`, `email` only). Never
 * assume/request any other tutor field (document, phone, address, ...) from
 * this endpoint — it deliberately exposes the minimum needed to pick a
 * tutor out of a search result, nothing else.
 */
export interface ResponsavelLookupDto {
  id: number;
  nome: string;
  email: string;
}

/**
 * `GET /api/responsaveis/busca?busca=...` — CONFIRMED VETERINARIO-allowed
 * (`SecurityConfig`: `GET /api/responsaveis/busca` →
 * `hasAnyRole("SYSADMIN", "ADMIN_CLINICA", "VETERINARIO")`), unlike the
 * general `/api/responsaveis` listing which is clinic-admin only. Returns a
 * Spring Data `Page`; zero matches is a normal, valid outcome (not an error).
 */
export async function searchResponsaveis(busca: string, page = 0, size = 20): Promise<ResponsavelLookupDto[]> {
  const params = new URLSearchParams({ busca, page: String(page), size: String(size) });
  const result = await apiGet<{ content: ResponsavelLookupDto[] }>(`/api/responsaveis/busca?${params.toString()}`);
  return result.content;
}
