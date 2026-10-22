import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/postgres';
import { countResetRequest, revokeAllUserTokens, clearLoginFailures } from '../db/redis';
import { hashPassword } from '../services/password.service';
import { generateResetToken, sha256 } from '../services/reset-token.service';
import { passwordSchema, containsEmailLocalPart } from '../services/password-policy';
import { env, webBaseUrl } from '../config/env';

const RESET_TTL_MINUTES      = 30;
const MAX_REQUESTS_PER_HOUR  = 3;
const GENERIC_MESSAGE        = 'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.';
const INVALID_TOKEN_MESSAGE  = 'El enlace es inválido o venció. Solicita uno nuevo.';
const EMAIL_IN_PASSWORD      = 'La contraseña no puede contener tu email';

type Locale = 'es' | 'en';

// ── Schemas de validación ─────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email:  z.string().email('Email inválido').toLowerCase(),
  locale: z.enum(['es', 'en']).optional().catch(undefined),
});

export const resetPasswordSchema = z.object({
  token:    z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Token inválido'),
  password: passwordSchema,
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────
// Responde lo mismo y al mismo tiempo exista o no el email: el trabajo va después.

export function forgotPassword(req: Request, res: Response) {
  const { email, locale } = req.body as z.infer<typeof forgotPasswordSchema>;
  res.status(202).json({ message: GENERIC_MESSAGE });
  void requestPasswordReset(email, locale).catch((err: Error) =>
    console.error('[forgot-password]', err.message));
}

export async function requestPasswordReset(email: string, locale?: Locale): Promise<void> {
  if ((await countResetRequest(sha256(email))) > MAX_REQUESTS_PER_HOUR) return;

  // Solo cuentas activas con contraseña local: una cuenta SSO no obtiene contraseña por esta vía.
  const { rows } = await query<{ id: string; full_name: string; language: string | null }>(
    `SELECT u.id, u.full_name, u.language
     FROM   users u
     JOIN   user_credentials uc ON uc.user_id = u.id
     WHERE  u.email = $1 AND u.is_active = true AND uc.password_hash IS NOT NULL`,
    [email]
  );
  const user = rows[0];
  if (!user) return;

  // No se invalidan los enlaces anteriores: así un tercero que conoce el email no puede
  // anular el enlace que la víctima ya recibió. Todos caen al completar un reset.
  const { token, tokenHash } = generateResetToken();
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + make_interval(mins => $3))`,
    [user.id, tokenHash, RESET_TTL_MINUTES]
  );

  // El idioma elegido en la web manda; users.language es el respaldo (hoy siempre 'es').
  const userLang = user.language?.slice(0, 2);
  const lang: Locale = locale ?? (userLang === 'en' ? 'en' : 'es');
  const resetUrl = `${webBaseUrl()}/reset-password?token=${token}`;

  const upstream = await fetch(`${env.NOTIFICATION_SERVICE_URL}/notifications/trigger`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      event:  'auth.password_reset',
      userId: user.id,
      email,
      locale: lang,
      data:   { userName: user.full_name, resetUrl, expiresMinutes: RESET_TTL_MINUTES },
    }),
  });
  if (!upstream.ok) throw new Error(`notification-service respondió ${upstream.status}`);
}

// ── POST /auth/reset-password ─────────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body as z.infer<typeof resetPasswordSchema>;

    const result = await withTransaction(async (client) => {
      // FOR UPDATE: de dos peticiones simultáneas con el mismo token, la segunda espera y, al
      // revalidar `used_at IS NULL`, ya no encuentra la fila → uso único.
      const valid = await client.query<{ user_id: string; email: string }>(
        `SELECT t.user_id, u.email
         FROM   password_reset_tokens t
         JOIN   users u ON u.id = t.user_id
         WHERE  t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > NOW()
         FOR UPDATE OF t`,
        [sha256(token)]
      );
      const id = valid.rows[0]?.user_id;
      if (!id) return null;
      const email = valid.rows[0].email;
      // Misma regla que el registro; el token no se consume (puede intentar con otra).
      if (containsEmailLocalPart(password, email)) return 'email-in-password' as const;

      // bcrypt solo con un token válido: un token inventado no cuesta un hash.
      const passwordHash = await hashPassword(password);
      const updated = await client.query(
        `UPDATE user_credentials uc
         SET    password_hash = $2, updated_at = NOW()
         FROM   users u
         WHERE  uc.user_id = $1 AND u.id = uc.user_id
           AND  u.is_active = true AND uc.password_hash IS NOT NULL`,
        [id, passwordHash]
      );
      if (!updated.rowCount) return null;

      // Consume este token y cualquier otro pendiente del usuario.
      await client.query(
        `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
        [id]
      );
      return { id, email };
    });

    if (!result) {
      res.status(400).json({ error: INVALID_TOKEN_MESSAGE });
      return;
    }
    if (result === 'email-in-password') {
      res.status(400).json({
        error:  'Datos inválidos',
        fields: [{ field: 'password', message: EMAIL_IN_PASSWORD }],
      });
      return;
    }

    await revokeAllUserTokens(result.id);
    // La contraseña ya cambió (commit hecho): un fallo de Redis acá no debe responder 500.
    await clearLoginFailures(sha256(result.email)).catch((err: Error) =>
      console.error('[reset-password] clearLoginFailures', err.message));
    res.json({ message: 'Contraseña actualizada. Inicia sesión de nuevo.' });
  } catch (err) {
    next(err);
  }
}
