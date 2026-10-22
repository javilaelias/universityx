import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth }  from '../middleware/auth';
import { ticketCtrl }   from '../controllers/ticket.controller';

const router = Router();

// Express 4 no captura promesas rechazadas: sin esto, un error de BD tumba el proceso.
type Handler = (req: Request, res: Response) => Promise<void>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(requireAuth);

router.param('id', (_req, res, next, id: string) => {
  if (!UUID_RE.test(id)) { res.status(400).json({ message: 'Id inválido' }); return; }
  next();
});

router.get  ('/',              wrap(ticketCtrl.list));
router.post ('/',              wrap(ticketCtrl.create));
router.get  ('/queue',         wrap(ticketCtrl.queue));     // staff: antes de /:id
router.get  ('/:id',           wrap(ticketCtrl.getById));
router.post ('/:id/messages',  wrap(ticketCtrl.addMessage));
router.put  ('/:id/status',    wrap(ticketCtrl.updateStatus));

export default router;
