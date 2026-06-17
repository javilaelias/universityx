import { Router }      from 'express';
import { requireAuth } from '../middleware/auth';
import { credentialCtrl } from '../controllers/credential.controller';

const router = Router();

router.post('/',        requireAuth, credentialCtrl.issue);
router.get ('/',        requireAuth, credentialCtrl.list);
router.get ('/:id',     credentialCtrl.getById);   // public for badge verification

export default router;
