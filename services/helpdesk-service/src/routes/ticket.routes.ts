import { Router }       from 'express';
import { requireAuth }  from '../middleware/auth';
import { ticketCtrl }   from '../controllers/ticket.controller';

const router = Router();

router.use(requireAuth);

router.get  ('/',              ticketCtrl.list);
router.post ('/',              ticketCtrl.create);
router.get  ('/:id',           ticketCtrl.getById);
router.post ('/:id/messages',  ticketCtrl.addMessage);
router.put  ('/:id/status',    ticketCtrl.updateStatus);

export default router;
