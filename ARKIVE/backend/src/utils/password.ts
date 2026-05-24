import { createHash, timingSafeEqual } from 'crypto';

export function hashPassword(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

/**
 * Verifica senha informada contra DS_SENHA_HASH.
 * - Usuários seed (acadêmico): comparação direta com o valor literal do banco (ex.: hash_senha_001).
 * - Usuários novos: comparação com SHA-256 (crypto nativo).
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false;

  if (plain === stored) {
    return true;
  }

  const inputHash = hashPassword(plain);
  if (inputHash.length !== stored.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(inputHash), Buffer.from(stored));
  } catch {
    return false;
  }
}
