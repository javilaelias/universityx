import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/postgres';
import { revokeAllUserTokens } from '../db/redis';
import { passwordSchema, containsEmailLocalPart } from '../services/password-policy';
import { hashPassword } from '../services/password.service';
import type { User } from '../types/auth.types';

const ROLES = ['student', 'instructor', 'support', 'admin'] as const;

// Columnas públicas: nunca se toca user_credentials.
const USER_COLUMNS = 'id, email, full_name, role, is_active, last_login_at, created_at';

// ── Schemas de validación ─────────────────────────────────────────────────────

export const listUsersSchema = z.object({
  search: z.string().trim().max(255).optional(),
  role:   z.enum(ROLES).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(50).default(20),
});

export const createUserSchema = z.object({
  email:    z.string().email('Email inválido').toLowerCase(),
  fullName: z.string().min(2, 'Nombre requerido').max(255),
  role:     z.enum(ROLES),
  password: passwordSchema,
}).refine((b) => !containsEmailLocalPart(b.password, b.email), {
  message: 'La contraseña no puede contener tu email',
  path:    ['password'],
});

export const updateUserSchema = z.object({
  role:     z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
}).refine((b) => b.role !== undefined || b.isActive !== undefined, {
  message: 'Nada que actualizar',
});

const uuidSchema = z.string().uuid();

// ── Controladores ─────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listUsersSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Parámetros inválidos' });
      return;
    }
    const { search, role, page, limit } = parsed.data;

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (search) {
      // % y _ del texto se buscan literalmente, no como comodines.
      params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
      conditions.push(`(email ILIKE $${params.length} OR full_name ILIKE $${params.length})`);
    }
    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ rows }, { rows: [{ count }] }] = await Promise.all([
      query<User>(
        `SELECT ${USER_COLUMNS} FROM users ${where}
         ORDER  BY created_at DESC
         LIMIT  $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]
      ),
      query<{ count: string }>(`SELECT COUNT(*) FROM users ${where}`, params),
    ]);

    const total = Number(count);
    res.json({ users: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, fullName, role, password } = req.body as z.infer<typeof createUserSchema>;

    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await withTransaction(async (client) => {
      const { rows } = await client.query<User>(
        `INSERT INTO users (email, full_name, role, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING ${USER_COLUMNS}`,
        [email, fullName, role]
      );
      await client.query(
        'INSERT INTO user_credentials (user_id, password_hash) VALUES ($1, $2)',
        [rows[0].id, passwordHash]
      );
      return rows[0];
    });

    res.status(201).json({ user });
  } catch (err) {
    // Dos altas simultáneas del mismo email: la segunda choca con el UNIQUE.
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Postgres compara UUID sin mayúsculas: normalizar para que las guardas no se salten.
    const id = req.params.id.toLowerCase();
    if (!uuidSchema.safeParse(id).success) {
      res.status(400).json({ error: 'Id inválido' });
      return;
    }
    if (id === req.user!.sub) {
      res.status(400).json({ error: 'No puedes modificar tu propia cuenta desde el panel' });
      return;
    }
    const { role, isActive } = req.body as z.infer<typeof updateUserSchema>;

    const result = await withTransaction(async (client) => {
      // Bloquea a los admins activos: dos cambios simultáneos no pueden dejar 0 admins.
      const { rows: admins } = await client.query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'admin' AND is_active = true FOR UPDATE`
      );
      const isActiveAdmin = admins.some((a) => a.id === id);
      const losesAdmin    = isActiveAdmin && ((role !== undefined && role !== 'admin') || isActive === false);
      if (losesAdmin && admins.length <= 1) return 'last_admin' as const;

      const { rows } = await client.query<User>(
        `UPDATE users
         SET    role      = COALESCE($2, role),
                is_active = COALESCE($3, is_active),
                updated_at = NOW()
         WHERE  id = $1
         RETURNING ${USER_COLUMNS}`,
        [id, role ?? null, isActive ?? null]
      );
      return rows[0] ?? null;
    });

    if (result === 'last_admin') {
      res.status(409).json({ error: 'Debe quedar al menos un administrador activo' });
      return;
    }
    if (!result) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // El refresh relee rol e is_active: sin sesiones vivas, el cambio rige al volver a entrar.
    await revokeAllUserTokens(id);
    res.json({ user: result });
  } catch (err) {
    next(err);
  }
}
