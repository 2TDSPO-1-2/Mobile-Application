import * as searchRepository from '../repositories/searchRepository';
import { badRequest } from '../utils/errors';

export async function search(term?: string, type?: string) {
  if (!term?.trim()) throw badRequest('Parâmetro q é obrigatório.');
  const allowed = ['responsavel', 'veterinario', 'animal', 'clinica'];
  if (type && !allowed.includes(type)) {
    throw badRequest(`type inválido. Use: ${allowed.join(', ')}`);
  }
  return searchRepository.search(term.trim(), type);
}
