export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function badRequest(message: string): AppError {
  return new AppError(400, message, 'BAD_REQUEST');
}

export function unauthorized(message = 'Não autorizado.'): AppError {
  return new AppError(401, message, 'UNAUTHORIZED');
}

export function notFound(message = 'Registro não encontrado.'): AppError {
  return new AppError(404, message, 'NOT_FOUND');
}

export function conflict(message: string): AppError {
  return new AppError(409, message, 'CONFLICT');
}

export function notImplemented(message: string): AppError {
  return new AppError(501, message, 'NOT_IMPLEMENTED');
}

export function mapOracleError(error: unknown): AppError {
  const err = error as { errorNum?: number; message?: string };
  const message = err.message ?? 'Erro interno no banco de dados.';

  if (err.errorNum === 1 || err.errorNum === 2290) {
    return conflict('Violação de integridade ou registro duplicado.');
  }
  if (err.errorNum === 1400 || err.errorNum === 2291) {
    return badRequest('Dados inválidos ou referência inexistente.');
  }

  return new AppError(500, message, 'ORACLE_ERROR');
}
