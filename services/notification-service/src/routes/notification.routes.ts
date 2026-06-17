import { Router }         from 'express';
import { requireAuth }   from '../middleware/auth';
import * as ctrl         from '../controllers/notification.controller';

const router = Router();

// Internal — no auth (called service-to-service)
router.post('/trigger', ctrl.trigger);

// User-facing — require JWT
router.get ('/',          requireAuth, ctrl.list);
router.get ('/count',     requireAuth, ctrl.unreadCount);
router.put ('/read-all',  requireAuth, ctrl.markAllRead);
router.put ('/:id/read',  requireAuth, ctrl.markRead);

export default router;
