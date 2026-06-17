import { Router }      from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl       from '../controllers/sync.controller';

const router = Router();

router.use(requireAuth);
router.post('/batch',  ctrl.batch);
router.get ('/status', ctrl.status);

export default router;
