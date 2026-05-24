import * as userRepository from '../repositories/userRepository';
import { notFound } from '../utils/errors';

export async function listUsers() {
  return userRepository.findAllUsers();
}

export async function getUser(id: number) {
  const user = await userRepository.findUserById(id);
  if (!user) throw notFound('Usuário não encontrado.');
  return user;
}
