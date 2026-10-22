import { test, expect } from './fixtures';
import { ADMIN, uniqueStudent, register, login } from './helpers';

test('admin: usuarios, cursos y tickets cargan', async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Administración' })).toBeVisible();

  await expect(page.getByRole('tab', { name: 'Usuarios' })).toHaveAttribute('aria-selected', 'true');
  await page.getByPlaceholder('Buscar por nombre o correo').fill(ADMIN.email);
  await page.getByPlaceholder('Buscar por nombre o correo').press('Enter');
  await expect(page.getByRole('cell', { name: ADMIN.email })).toBeVisible();

  await page.getByRole('tab', { name: 'Cursos' }).click();
  await expect(page.getByText('Fundamentos de Bases de Datos').first()).toBeVisible();

  await page.getByRole('tab', { name: 'Tickets' }).click();
  await expect(page.getByRole('tab', { name: 'Tickets' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('No se pudo completar la acción.')).toHaveCount(0);
});

test('admin: un estudiante no entra y la API responde 403', async ({ page }) => {
  await register(page, uniqueStudent('noadmin'));
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/dashboard/);
  const res = await page.request.get('/api/admin/users');
  expect(res.status()).toBe(403);
});
