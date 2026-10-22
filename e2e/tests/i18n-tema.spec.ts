import { test, expect } from './fixtures';
import { uniqueStudent, register } from './helpers';

test('idioma ES por defecto y EN persistente; tema claro/oscuro persistente', async ({ page }) => {
  await register(page, uniqueStudent('i18n'));
  const nav = page.locator('header');
  const html = page.locator('html');

  // ES por defecto
  await expect(nav.getByRole('link', { name: 'Cursos' })).toBeVisible();
  await nav.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Courses' })).toBeVisible();
  await page.reload();
  await expect(nav.getByRole('link', { name: 'Courses' })).toBeVisible();
  await expect(html).toHaveAttribute('lang', 'en');

  // Tema
  await expect(html).not.toHaveClass(/\bdark\b/);
  await nav.getByTitle('Dark mode').click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await nav.getByTitle('Light mode').click();
  await expect(html).not.toHaveClass(/\bdark\b/);

  // Vuelta a ES
  await nav.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Cursos' })).toBeVisible();
});

test('pantalla pública (login) en ES por defecto y EN al elegirlo', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('ux-lang', 'en'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
