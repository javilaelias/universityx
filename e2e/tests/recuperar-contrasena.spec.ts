import { test, expect } from './fixtures';
import { uniqueStudent, register, logout, login, seedResetToken } from './helpers';

test('recuperar contraseña: respuesta genérica, token de un solo uso y clave nueva', async ({ page }) => {
  const s = uniqueStudent('reset');
  await register(page, s);
  await logout(page);

  // Respuesta genérica, exista o no el correo
  for (const email of [s.email, `nadie.${Date.now()}@e2e.test`]) {
    await page.goto('/forgot-password', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/Si el correo está registrado/)).toBeVisible();
  }

  const token = await seedResetToken(s.email);
  const nueva = `${s.password}Nueva7`;
  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  const pw = page.locator('input[type="password"]');
  await pw.nth(0).fill(nueva);
  await pw.nth(1).fill(nueva);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/login\?reset=1/);

  // La clave vieja ya no entra; la nueva sí
  await login(page, s.email, s.password);
  await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  await login(page, s.email, nueva);
  await expect(page).toHaveURL(/\/dashboard/);

  // El token no se reutiliza
  await logout(page);
  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  await pw.nth(0).fill(`${nueva}b`);
  await pw.nth(1).fill(`${nueva}b`);
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('El enlace es inválido o venció.')).toBeVisible();
});
