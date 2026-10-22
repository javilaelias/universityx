import { test, expect } from './fixtures';
import {
  COURSE_ID, COURSE_TITLE, CONTENT_IDS, QUIZ_ID, QUIZ_ANSWERS,
  uniqueStudent, register, login, logout,
} from './helpers';

test('login → matrícula → contenido → quiz → certificado → verificación pública', async ({ page, browser }) => {
  const s = uniqueStudent('flujo');

  // Registro + login con la cuenta nueva
  await register(page, s);
  await logout(page);
  await login(page, s.email, s.password);
  await expect(page).toHaveURL(/\/dashboard/);

  // Catálogo → curso → matrícula
  await page.goto('/courses');
  await page.getByText(COURSE_TITLE).first().click();
  await expect(page).toHaveURL(new RegExp(`/courses/${COURSE_ID}`));
  await page.getByRole('button', { name: 'Matricularme' }).click();
  await expect(page.getByText('¡Matriculado correctamente!')).toBeVisible();

  // Contenido visible y desbloqueado. La web no tiene visor de contenido: video y documento se
  // marcan vistos con la misma ruta BFF (/api/progress) que usaría ese botón.
  await expect(page.getByText('¿Qué es una base de datos?')).toBeVisible();
  await expect(page.getByText('Guía de referencia SQL')).toBeVisible();
  for (const contentItemId of CONTENT_IDS) {
    const res = await page.request.post('/api/progress', { data: { contentItemId, completed: true } });
    expect(res.status(), await res.text()).toBeLessThan(300);
  }
  // El quiz no se puede dar por visto: solo cuenta aprobándolo
  const quizShortcut = await page.request.post('/api/progress', { data: { contentItemId: QUIZ_ID, completed: true } });
  expect(quizShortcut.status()).toBe(422);

  // Quiz aprobado
  await page.getByRole('link', { name: /Quiz: Conceptos básicos/ }).click();
  await expect(page).toHaveURL(new RegExp(`/quiz/${QUIZ_ID}`));
  for (const [i, answer] of QUIZ_ANSWERS.entries()) {
    await page.locator('label', { hasText: answer }).first().click();
    if (i < QUIZ_ANSWERS.length - 1) await page.getByRole('button', { name: /Siguiente/ }).click();
  }
  await page.getByRole('button', { name: /^Finalizar/ }).click();
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByText('¡Aprobado!')).toBeVisible();

  // Certificado: el perfil emite la credencial del curso al 100 %
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Reclamar credenciales' }).click();
  await expect(page.getByText('¡Credencial emitida!', { exact: false })).toBeVisible();
  const verifyLink = page.locator('a[href^="/verify/"]').first();
  await expect(verifyLink).toBeVisible();
  const href = (await verifyLink.getAttribute('href'))!;

  // PDF del certificado
  const pdf = await page.request.get(`/api/credentials/${href.split('/').pop()}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');

  // Verificación pública, sin sesión
  const anon = await browser.newContext();
  const pub = await anon.newPage();
  await pub.goto(href);
  await expect(pub.getByText('Credencial verificada')).toBeVisible();
  await expect(pub.getByText(s.name)).toBeVisible();
  await expect(pub.getByText(COURSE_TITLE).first()).toBeVisible();
  await pub.goto('/verify/00000000-0000-0000-0000-000000000000');
  await expect(pub.getByText('Credencial no encontrada')).toBeVisible();
  await anon.close();
});
