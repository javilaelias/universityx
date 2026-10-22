import { createHash, randomBytes } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { Client } from 'pg';

// Datos propios de cada corrida: la suite se repite sin resetear la BD.
export const ADMIN = { email: 'admin@universidadx.com', password: 'Test1234!' }; // seed 005
export const COURSE_ID = 'a0000000-0000-0000-0000-000000000001';             // seed 004
export const COURSE_TITLE = 'Fundamentos de Bases de Datos';
export const CONTENT_IDS = ['c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'];
export const QUIZ_ID = 'c0000000-0000-0000-0000-000000000003';
export const QUIZ_ANSWERS = ['Structured Query Language', 'SELECT'];

export function uniqueStudent(prefix = 'e2e') {
  const id = `${Date.now()}${randomBytes(3).toString('hex')}`;
  return { name: `E2E ${prefix} ${id}`, email: `${prefix}.${id}@e2e.test`, password: `Clave${id}x9` };
}

// networkidle: los formularios son controlados; llenar antes de hidratar pierde lo escrito.
export async function register(page: Page, s: { name: string; email: string; password: string }) {
  await page.goto('/register', { waitUntil: 'networkidle' });
  await page.locator('input[type="text"]').first().fill(s.name);
  await page.locator('input[type="email"]').fill(s.email);
  const pw = page.locator('input[type="password"]');
  await pw.nth(0).fill(s.password);
  await pw.nth(1).fill(s.password);
  await expect(pw.nth(1)).toHaveValue(s.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await expect(page.locator('input[type="email"]')).toHaveValue(email);
  await page.locator('form button[type="submit"]').first().click();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /Salir|Sign out/ }).click();
  await expect(page).toHaveURL(/\/login/);
}

function db() {
  return new Client({
    connectionString: process.env.E2E_DATABASE_URL
      ?? 'postgresql://ux_admin:ux_dev_pass_2024@localhost:5436/universidadx',
  });
}

// El correo de recuperación va a consola en dev/CI: se siembra el token como lo guarda auth-service
// (solo el SHA-256, 30 min, un solo uso) y se devuelve el token en claro.
export async function seedResetToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const c = db();
  await c.connect();
  try {
    const { rowCount } = await c.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       SELECT id, $2, NOW() + INTERVAL '30 minutes' FROM users WHERE email = $1`,
      [email, hash],
    );
    expect(rowCount).toBe(1);
  } finally {
    await c.end();
  }
  return token;
}
