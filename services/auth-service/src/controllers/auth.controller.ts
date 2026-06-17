import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../db/postgres';
import {
  storeRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../db/redis';
import { hashPassword, verifyPassword } from '../services/password.service';
import { generateTokenPair, verifyRefreshToken } from '../services/jwt.service';
import type { User } from '../types/auth.types';

// ── Schemas de validación ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  email:    z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  fullName: z.string().min(2, 'Nombre requerido').max(255),
});

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeUser(user: User & { password_hash?: string }) {
  const { password_hash: _, ...safe } = user;
  return safe;
}

// ── Controladores ─────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName } = req.body as z.infer<typeof registerSchema>;

    const existing = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const { rows } = await query<User>(
      `INSERT INTO users (email, full_name, role, is_active)
       VALUES ($1, $2, 'student', true)
       RETURNING id, email, full_name, role, avatar_url, is_active, created_at`,
      [email, fullName]
    );
    const user = rows[0];

    // Guardar hash de contraseña en tabla separada (buena práctica)
    await query(
      `INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)`,
      [user.id, passwordHash]
    );

    const { accessToken, refreshToken, expiresIn, tokenId } =
      generateTokenPair(user.id, user.email, user.role);

    await storeRefreshToken(user.id, tokenId);

    res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const { rows } = await query<User & { password_hash: string }>(
      `SELECT u.id, u.email, u.full_name, u.role, u.avatar_url, u.is_active, u.created_at,
              uc.password_hash
       FROM   users u
       LEFT   JOIN user_credentials uc ON uc.user_id = u.id
       WHERE  u.email = $1`,
      [email]
    );

    const user = rows[0];
    const valid =
      user && user.password_hash && (await verifyPassword(password, user.password_hash));

    if (!valid) {
      // Mismo mensaje para no revelar si el email existe
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Cuenta desactivada' });
      return;
    }

    // Actualizar last_login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const { accessToken, refreshToken, expiresIn, tokenId } =
      generateTokenPair(user.id, user.email, user.role);

    await storeRefreshToken(user.id, tokenId);

    res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
      expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: 'Refresh token inválido o expirado' });
      return;
    }

    const isValid = await validateRefreshToken(payload.sub, payload.tokenId);
    if (!isValid) {
      res.status(401).json({ error: 'Sesión revocada' });
      return;
    }

    // Rotación: revocar el token actual e issuar uno nuevo
    await revokeRefreshToken(payload.sub, payload.tokenId);

    const { rows } = await query<User>(
      `SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`,
      [payload.sub]
    );

    if (!rows[0]) {
      res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
      return;
    }

    const user = rows[0];
    const { accessToken, refreshToken: newRefreshToken, expiresIn, tokenId } =
      generateTokenPair(user.id, user.email, user.role);

    await storeRefreshToken(user.id, tokenId);

    res.json({ accessToken, refreshToken: newRefreshToken, expiresIn });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;

    try {
      const payload = verifyRefreshToken(refreshToken);
      await revokeRefreshToken(payload.sub, payload.tokenId);
    } catch {
      // Si el token ya expiró o es inválido, igual respondemos OK
    }

    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    await revokeAllUserTokens(req.user!.sub);
    res.json({ message: 'Todas las sesiones cerradas' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await query<User>(
      `SELECT id, email, institutional_email, full_name, role, avatar_url,
              timezone, language, dark_mode_enabled, last_login_at, created_at
       FROM   users
       WHERE  id = $1 AND is_active = true`,
      [req.user!.sub]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── SSO (stub — implementar con passport-saml en V2) ─────────────────────────

