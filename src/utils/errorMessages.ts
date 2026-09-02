import { ApiError, isNetworkError } from '../services/apiClient';

/** Translates a save-narrative failure into veterinarian-facing language — never the raw HTTP/API detail. */
export function describeNarrativeSaveError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Sem conexão com o servidor. A narrativa não foi salva — tente novamente.';
  }
  return 'Falha ao salvar a narrativa clínica. Tente novamente.';
}

/** Translates a clinical-support request failure into veterinarian-facing language. */
export function describeClinicalSupportError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Você não tem permissão para solicitar apoio clínico para esta consulta.';
    }
    if (error.status === 409) {
      return 'O status desta consulta pode ter mudado. As informações foram atualizadas — verifique antes de tentar novamente.';
    }
    if (error.status >= 500) {
      return 'O serviço de apoio clínico está indisponível no momento. Tente novamente em instantes.';
    }
    return 'Não foi possível solicitar o apoio clínico agora.';
  }
  if (isNetworkError(error)) {
    return 'Sem conexão com o serviço de apoio clínico. Verifique sua internet antes de tentar novamente.';
  }
  return 'Não foi possível solicitar o apoio clínico agora.';
}

/** Translates a finalization failure into veterinarian-facing language. */
export function describeFinalizeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return 'Verifique os dados informados na conclusão e tente novamente.';
    }
    if (error.status === 403) {
      return 'Você não tem permissão para finalizar esta consulta.';
    }
    if (error.status === 404) {
      return 'Esta consulta não foi encontrada.';
    }
    if (error.status === 409) {
      return 'O status desta consulta pode ter mudado. As informações foram atualizadas — verifique antes de tentar novamente.';
    }
    if (error.status >= 500) {
      return 'Não foi possível finalizar a consulta agora. Tente novamente em instantes.';
    }
    return 'Não foi possível finalizar a consulta agora.';
  }
  if (isNetworkError(error)) {
    return 'Sem conexão com o servidor. A consulta não foi finalizada — tente novamente.';
  }
  return 'Não foi possível finalizar a consulta agora.';
}
