import { badRequest } from './errors';
import type { LoginRequest, RegisterRequest, ApiUserRole } from '../types';

function readString(body: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = body[key];
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

export function parseLoginBody(body: Record<string, unknown>): LoginRequest {
  const role = body.role as ApiUserRole | undefined;
  const identifier = readString(body, [
    'identifier',
    'cpf',
    'crmv',
    'login',
    'username',
  ]);
  const password = readString(body, ['password', 'senha']);

  if (!role || (role !== 'tutor' && role !== 'veterinario')) {
    throw badRequest('Campo role é obrigatório (tutor ou veterinario).');
  }
  if (!identifier) {
    throw badRequest('Identificador é obrigatório (CPF ou CRMV).');
  }
  if (!password) {
    throw badRequest('Senha é obrigatória.');
  }

  return { role, identifier, password };
}

export function parseRegisterBody(body: Record<string, unknown>): RegisterRequest {
  const role = body.role as ApiUserRole | undefined;
  const name = readString(body, ['name', 'nome']);
  const email = readString(body, ['email']);
  const phone = readString(body, ['phone', 'telefone']);
  const password = readString(body, ['password', 'senha']);
  const cpf = readString(body, ['cpf']);
  const crmv = readString(body, ['crmv']);

  if (!role || (role !== 'tutor' && role !== 'veterinario')) {
    throw badRequest('Campo role é obrigatório (tutor ou veterinario).');
  }
  if (!name) throw badRequest('Nome é obrigatório.');
  if (!password) throw badRequest('Senha é obrigatória.');
  if (role === 'tutor' && !cpf) {
    throw badRequest('CPF é obrigatório para tutor.');
  }
  if (role === 'veterinario' && !crmv) {
    throw badRequest('CRMV é obrigatório para veterinário.');
  }

  return {
    role,
    name,
    email: email || undefined,
    phone: phone || undefined,
    password,
    cpf,
    crmv: crmv || undefined,
  };
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeCrmv(value: string): string {
  return value.trim().toUpperCase().replace(/\s/g, '');
}
