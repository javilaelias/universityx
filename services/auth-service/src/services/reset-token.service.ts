import { createHash, randomBytes } from 'crypto';

// 32 bytes aleatorios → 43 caracteres base64url. En la BD solo se guarda el SHA-256:
// con 256 bits de entropía no hace falta un hash lento y se puede buscar por igualdad.
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: sha256(token) };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
