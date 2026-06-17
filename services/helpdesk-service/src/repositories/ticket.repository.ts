import { pool } from '../db/postgres';

export interface Ticket {
  id:          string;
  user_id:     string;
  category:    string;
  subject:     string;
  description: string;
  status:      string;
  priority:    string;
  assigned_to: string | null;
  resolved_at: Date | null;
  created_at:  Date;
  updated_at:  Date;
  // joined
  user_name?:  string;
  user_email?: string;
}

export interface TicketMessage {
  id:          string;
  ticket_id:   string;
  author_id:   string;
  author_name: string;
  author_role: string;
  body:        string;
  is_internal: boolean;
  created_at:  Date;
}

export const ticketRepo = {
  async findByUser(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query<Ticket>(
      `SELECT t.*
       FROM   support_tickets t
       WHERE  t.user_id = $1
       ORDER  BY t.updated_at DESC
       LIMIT  $2 OFFSET $3`,
      [userId, limit, offset],
    );
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM support_tickets WHERE user_id = $1`,
      [userId],
    );
    return { tickets: rows, total: Number(count) };
  },

  async findById(id: string, userId: string, isAdmin: boolean) {
    const { rows } = await pool.query<Ticket>(
      `SELECT t.*, u.full_name AS user_name, u.email AS user_email
       FROM   support_tickets t
       JOIN   users u ON u.id = t.user_id
       WHERE  t.id = $1 ${isAdmin ? '' : 'AND t.user_id = $2'}`,
      isAdmin ? [id] : [id, userId],
    );
    return rows[0] ?? null;
  },

  async findMessages(ticketId: string, isAdmin: boolean) {
    const where = isAdmin ? '' : 'AND m.is_internal = false';
    const { rows } = await pool.query<TicketMessage>(
      `SELECT m.id, m.ticket_id, m.author_id, u.full_name AS author_name,
              u.role AS author_role, m.body, m.is_internal, m.created_at
       FROM   ticket_messages m
       JOIN   users u ON u.id = m.author_id
       WHERE  m.ticket_id = $1 ${where}
       ORDER  BY m.created_at ASC`,
      [ticketId],
    );
    return rows;
  },

  async create(data: {
    userId: string; category: string; subject: string; description: string; priority?: string;
  }) {
    const { rows } = await pool.query<Ticket>(
      `INSERT INTO support_tickets (user_id, category, subject, description, priority)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.category, data.subject, data.description, data.priority ?? 'medium'],
    );
    return rows[0];
  },

  async addMessage(data: { ticketId: string; authorId: string; body: string; isInternal?: boolean }) {
    const { rows } = await pool.query<TicketMessage>(
      `INSERT INTO ticket_messages (ticket_id, author_id, body, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING id, ticket_id, author_id, body, is_internal, created_at`,
      [data.ticketId, data.authorId, data.body, data.isInternal ?? false],
    );
    await pool.query(
      `UPDATE support_tickets SET updated_at = NOW(), status = CASE
         WHEN status = 'waiting_user' THEN 'in_progress'::ticket_status
         ELSE status END
       WHERE id = $1`,
      [data.ticketId],
    );
    return rows[0];
  },

  async updateStatus(id: string, status: string, assignedTo?: string) {
    const { rows } = await pool.query<Ticket>(
      `UPDATE support_tickets
       SET    status      = $2,
              assigned_to = COALESCE($3, assigned_to),
              resolved_at = CASE WHEN $2 IN ('resolved','closed') THEN NOW() ELSE resolved_at END,
              updated_at  = NOW()
       WHERE  id = $1
       RETURNING *`,
      [id, status, assignedTo ?? null],
    );
    return rows[0] ?? null;
  },
};
