// Misma política que auth-service (services/auth-service/src/services/password-policy.ts):
// la web avisa antes de enviar; el servidor es quien decide. Mantener ambas listas iguales.
const COMMON = new Set([
  'password123', 'password1234', 'contraseña123', 'contrasena123', '1234567890a', 'a1234567890',
  'qwerty12345', 'qwertyuiop1', 'abc1234567', 'abcd123456', '123456789a', 'iloveyou123',
  'welcome123', 'bienvenido1', 'admin12345', 'administrador1', 'universidad1', 'estudiante1',
  'passw0rd123', 'p4ssw0rd123', 'letmein1234', 'football123', 'monkey12345', 'dragon12345',
  'sunshine123', 'princess123', 'master12345', 'superman123', 'teamo123456', 'changeme123',
]);

// Igual que el \p{L} del servidor; con RegExp porque el target ES5 de tsc no admite el literal /u.
const LETTER = new RegExp('\\p{L}', 'u');

export type PasswordPolicyError =
  | 'register.err_short'
  | 'register.err_letter_digit'
  | 'register.err_common'
  | 'register.err_email';

export function passwordPolicyError(password: string, email?: string): PasswordPolicyError | null {
  if (password.length < 10) return 'register.err_short';
  if (!LETTER.test(password) || !/\d/.test(password)) return 'register.err_letter_digit';
  if (COMMON.has(password.toLowerCase())) return 'register.err_common';
  const local = email?.split('@')[0]?.toLowerCase() ?? '';
  if (local.length >= 3 && password.toLowerCase().includes(local)) return 'register.err_email';
  return null;
}

// ¿El 400 de validación de auth-service (`{ fields: [{ field, message }] }`) es por la contraseña?
export function failedPassword(body: unknown): boolean {
  const fields = (body as { fields?: { field?: string }[] } | null)?.fields;
  return Array.isArray(fields) && fields.some((x) => x?.field === 'password');
}
