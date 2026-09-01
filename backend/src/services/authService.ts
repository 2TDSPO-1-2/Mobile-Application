import * as userRepository from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';
import { badRequest, unauthorized } from '../utils/errors';
import type { LoginRequest, RegisterRequest, ApiUser } from '../types';
import { onlyDigits } from '../utils/authPayload';

export async function login(data: LoginRequest): Promise<ApiUser> {
  if (!data.identifier?.trim() || !data.password?.trim()) {
    throw badRequest('Identificador e senha são obrigatórios.');
  }

  let found = await userRepository.findUserForAuth(data.role, data.identifier.trim());

  if (!found) {
    found = await userRepository.findUserByDsLogin(data.identifier.trim());
  }

  if (!found || found.role !== data.role) {
    throw unauthorized('Credenciais inválidas.');
  }

  if (!verifyPassword(data.password, found.passwordHash)) {
    throw unauthorized('Credenciais inválidas.');
  }

  const { passwordHash: _, ...user } = found;
  return user;
}

export async function register(data: RegisterRequest): Promise<ApiUser> {
  if (!data.name?.trim() || !data.password?.trim()) {
    throw badRequest('Nome e senha são obrigatórios.');
  }
  if (data.role === 'veterinario' && !data.crmv?.trim()) {
    throw badRequest('CRMV é obrigatório para veterinários.');
  }
  if (data.role === 'tutor' && !data.cpf?.trim()) {
    throw badRequest('CPF é obrigatório para tutores.');
  }

  const cpf = onlyDigits(data.cpf ?? '');
  const crmv = data.crmv?.trim();

  const existing = await userRepository.findUserForAuth(
    data.role,
    data.role === 'tutor' ? cpf : crmv ?? ''
  );
  if (existing) {
    throw badRequest('Usuário já cadastrado.');
  }

  return userRepository.registerUser({
    role: data.role,
    name: data.name.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    passwordHash: hashPassword(data.password),
    cpf,
    crmv: crmv ? crmv.toUpperCase() : undefined,
  });
}
