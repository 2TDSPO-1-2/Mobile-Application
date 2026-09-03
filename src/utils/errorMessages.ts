import { ApiError, isNetworkError } from '../services/apiClient';
import { RecordingFileError } from '../services/transcricaoService';

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

/**
 * Translates a prescription create/update/delete failure. The 409 case is
 * confirmed to mean one specific thing server-side
 * (`PrescricaoService.exigirSemAdesaoRegistrada`): the prescription already
 * has an adherence record and can no longer be changed or removed.
 */
export function describePrescricaoError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return 'Verifique os dados da prescrição e tente novamente.';
    }
    if (error.status === 403) {
      return 'Você não tem permissão para esta prescrição.';
    }
    if (error.status === 404) {
      return 'Esta prescrição não foi encontrada.';
    }
    if (error.status === 409) {
      return 'Esta prescrição já possui registro de adesão e não pode mais ser alterada ou excluída.';
    }
    if (error.status >= 500) {
      return 'Não foi possível salvar a prescrição agora. Tente novamente em instantes.';
    }
    return 'Não foi possível salvar a prescrição agora.';
  }
  if (isNetworkError(error)) {
    return 'Sem conexão com o servidor. A prescrição não foi salva — tente novamente.';
  }
  return 'Não foi possível salvar a prescrição agora.';
}

/**
 * Translates a patient create/update failure. The 403 case is confirmed to
 * mean one specific thing for a VETERINARIO caller
 * (`AnimalService.clinicaVeterinarioAutenticado`): the authenticated vet has
 * no clinic linked, so the backend can't derive one to attach the patient to.
 */
export function describePatientError(error: unknown, isUpdate = false): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return 'Verifique os dados do paciente e tente novamente.';
    }
    if (error.status === 403) {
      return 'Seu cadastro de veterinário não está vinculado a uma clínica.';
    }
    if (error.status === 404) {
      return 'Espécie ou raça informada não foi encontrada.';
    }
    if (error.status === 409) {
      return 'Não foi possível salvar o paciente com esses dados agora.';
    }
    if (error.status >= 500) {
      return isUpdate
        ? 'Não foi possível salvar as alterações agora. Tente novamente em instantes.'
        : 'Não foi possível cadastrar o paciente agora. Tente novamente em instantes.';
    }
    return isUpdate ? 'Não foi possível salvar as alterações do paciente.' : 'Não foi possível cadastrar o paciente.';
  }
  if (isNetworkError(error)) {
    return isUpdate
      ? 'Sem conexão com o servidor. As alterações não foram salvas — tente novamente.'
      : 'Sem conexão com o servidor. O paciente não foi cadastrado — tente novamente.';
  }
  return isUpdate ? 'Não foi possível salvar as alterações do paciente.' : 'Não foi possível cadastrar o paciente.';
}

/**
 * Translates a POST /api/transcricoes failure. Status codes confirmed
 * against `TranscricaoService.java`: 400 (missing/unreadable/unsupported
 * audio), 413 (`AzureSpeechProperties.maxUploadSize`, 10MB default), 422
 * (Azure returned no speech), 401 handled globally. 403/429/502/503 are the
 * product's own mapped language for the remaining documented cases.
 */
export function describeTranscriptionError(error: unknown): string {
  if (error instanceof RecordingFileError) {
    return 'A gravação não foi encontrada. Grave novamente.';
  }
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return 'Não foi possível processar este áudio.';
    }
    if (error.status === 403) {
      return 'Seu usuário não possui permissão para usar a transcrição.';
    }
    if (error.status === 413) {
      return 'O áudio é muito grande. Grave uma mensagem mais curta.';
    }
    if (error.status === 422) {
      return 'Nenhuma fala foi reconhecida. Tente novamente.';
    }
    if (error.status === 429) {
      return 'O serviço de transcrição está ocupado. Tente novamente em instantes.';
    }
    if (error.status === 502 || error.status === 503 || error.status >= 500) {
      return 'O serviço de transcrição está temporariamente indisponível.';
    }
    return 'Não foi possível transcrever o áudio agora.';
  }
  if (isNetworkError(error)) {
    return 'Não foi possível enviar o áudio. Verifique sua conexão e tente novamente.';
  }
  return 'Não foi possível transcrever o áudio agora.';
}
