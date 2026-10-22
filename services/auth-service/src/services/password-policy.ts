import { z } from 'zod';

// Política única para todo lugar donde se fija una contraseña (registro y reset).
// Las contraseñas ya guardadas no se revalidan: siguen sirviendo para entrar.
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

// Lista corta de las más usadas (la web valida lo mismo antes de enviar).
const COMMON = new Set([
  'password123', 'password1234', 'contraseña123', 'contrasena123', '1234567890a', 'a1234567890',
  'qwerty12345', 'qwertyuiop1', 'abc1234567', 'abcd123456', '123456789a', 'iloveyou123',
  'welcome123', 'bienvenido1', 'admin12345', 'administrador1', 'universidad1', 'estudiante1',
  'passw0rd123', 'p4ssw0rd123', 'letmein1234', 'football123', 'monkey12345', 'dragon12345',
  'sunshine123', 'princess123', 'master12345', 'superman123', 'teamo123456', 'changeme123',
]);

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Mínimo ${PASSWORD_MIN} caracteres`)
  .max(PASSWORD_MAX, `Máximo ${PASSWORD_MAX} caracteres`)
  .regex(/\p{L}/u, 'Debe incluir al menos una letra')
  .regex(/\d/, 'Debe incluir al menos un número')
  .refine((p) => !COMMON.has(p.toLowerCase()), 'Contraseña demasiado común');

// La parte local del email (≥ 3 caracteres) no puede estar dentro de la contraseña.
export function containsEmailLocalPart(password: string, email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  return local.length >= 3 && password.toLowerCase().includes(local);
}
