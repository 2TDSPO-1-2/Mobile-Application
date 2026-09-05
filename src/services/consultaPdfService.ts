import { apiGetBinary } from './apiClient';

/**
 * Thrown when the server responded 2xx but the body isn't actually a usable
 * PDF (wrong/missing Content-Type, or empty body) — distinct from `ApiError`
 * (a real HTTP failure status) so `describeConsultaPdfError` can map it to
 * its own message instead of a generic one.
 */
export class InvalidPdfError extends Error {
  constructor(message = 'O servidor não retornou um PDF válido.') {
    super(message);
    this.name = 'InvalidPdfError';
  }
}

export interface ConsultaResumoPdf {
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
}

/**
 * `GET /api/consultas/{id}/resumo-pdf` — confirmed backend contract: Basic
 * Auth required, only valid for a FI consultation (409 otherwise), returns
 * `application/pdf` with `Content-Disposition: attachment` and
 * `Cache-Control: no-store`. Java owns the entire document — this app never
 * builds/reconstructs PDF content from the transcript or
 * `ClinicalSupportResponse`; it only ever downloads and re-shares these exact
 * bytes.
 *
 * `Cache-Control: no-store` on the response is honored implicitly: nothing
 * here (or anywhere else in this app) persists these bytes past the
 * immediate share/download action — no AsyncStorage, no SecureStore, no
 * TanStack Query cache. Every tap re-fetches from the server.
 */
export async function downloadConsultaResumoPdf(consultaId: number): Promise<ConsultaResumoPdf> {
  const { data, contentType } = await apiGetBinary(`/api/consultas/${consultaId}/resumo-pdf`);

  if (!contentType || !contentType.toLowerCase().includes('application/pdf')) {
    throw new InvalidPdfError();
  }
  if (data.byteLength === 0) {
    throw new InvalidPdfError();
  }

  return { bytes: new Uint8Array(data), contentType };
}

// eslint-disable-next-line no-misleading-character-class -- intentional: matches NFD combining diacritics (U+0300-U+036F) to strip accents below.
const COMBINING_DIACRITICS_PATTERN = /[̀-ͯ]/g;
const FILENAME_UNSAFE_PATTERN = /[^a-z0-9]+/g;

/**
 * `arkive-thor-65.pdf` when a safe patient name is available, falling back to
 * `arkive-consulta-65.pdf` otherwise (no name, or it normalizes to nothing —
 * e.g. a name that's only punctuation/emoji).
 */
export function buildConsultaPdfFilename(consultaId: number, animalNome?: string | null): string {
  const slug = animalNome
    ?.normalize('NFD')
    .replace(COMBINING_DIACRITICS_PATTERN, '') // strip accents (e.g. "Thór" -> "Thor") before the safety filter below
    .toLowerCase()
    .replace(FILENAME_UNSAFE_PATTERN, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? `arkive-${slug}-${consultaId}.pdf` : `arkive-consulta-${consultaId}.pdf`;
}
