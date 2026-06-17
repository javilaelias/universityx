import { Response }      from 'express';
import { z }             from 'zod';
import { ticketRepo }    from '../repositories/ticket.repository';
import { env }           from '../config/env';
import type { AuthRequest } from '../middleware/auth';

const NOTIF_URL = env.NOTIFICATION_SERVICE_URL;

async function notifyAsync(event: string, userId: string, email: string, data: Record<string, unknown>) {
  fetch(`${NOTIF_URL}/notifications/trigger`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ event, userId, email, data }),
  }).catch(err => console.error('[notify]', err.message));
}

const createSchema = z.object({
  category:    z.enum(['payment', 'technical', 'academic', 'certificate', 'administrative']),
  subject:     z.string().min(5).max(500),
  description: z.string().min(10),
  priority:    z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const messageSchema = z.object({
  body:       z.string().min(1),
  isInternal: z.boolean().optional(),
});

const statusSchema = z.object({
  status:     z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']),
  assignedTo: z.string().uuid().optional(),
});

export const ticketCtrl = {
  async list(req: AuthRequest, res: Response) {
    const page  = Math.max(Number(req.query.page)  || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const result = await ticketRepo.findByUser(req.userId!, page, limit);
    res.json({ ...result, page, totalPages: Math.ceil(result.total / limit) });
  },

  async create(req: AuthRequest, res: Response) {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() }); return; }

    const ticket = await ticketRepo.create({ userId: req.userId!, ...parsed.data });

    notifyAsync('ticket.created', req.userId!, req.userEmail!, {
      ticketId: ticket.id,
      subject:  ticket.subject,
      userName: req.userEmail,
    });

    res.status(201).json({ ticket });
  },

  async getById(req: AuthRequest, res: Response) {
    const isAdmin = ['admin', 'support'].includes(req.userRole ?? '');
    const ticket  = await ticketRepo.findById(req.params.id, req.userId!, isAdmin);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }

    const messages = await ticketRepo.findMessages(req.params.id, isAdmin);
    res.json({ ticket, messages });
  },

  async addMessage(req: AuthRequest, res: Response) {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() }); return; }

    const isAdmin   = ['admin', 'support'].includes(req.userRole ?? '');
    const isInternal = parsed.data.isInternal && isAdmin;

    // Verify ticket access
    const ticket = await ticketRepo.findById(req.params.id, req.userId!, isAdmin);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }

    const message = await ticketRepo.addMessage({
      ticketId:   req.params.id,
      authorId:   req.userId!,
      body:       parsed.data.body,
      isInternal: isInternal ?? false,
    });

    // Notify the other party
    if (isAdmin && !isInternal) {
      notifyAsync('ticket.reply', ticket.user_id, ticket.user_email!, {
        subject:  ticket.subject,
        userName: ticket.user_name,
      });
    }

    res.status(201).json({ message });
  },

  async updateStatus(req: AuthRequest, res: Response) {
    if (!['admin', 'support'].includes(req.userRole ?? '')) {
      res.status(403).json({ message: 'Solo soporte puede cambiar el estado' }); return;
    }
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() }); return; }

    const ticket = await ticketRepo.updateStatus(req.params.id, parsed.data.status, parsed.data.assignedTo);
    if (!ticket) { res.status(404).json({ message: 'Ticket no encontrado' }); return; }

    res.json({ ticket });
  },
};
