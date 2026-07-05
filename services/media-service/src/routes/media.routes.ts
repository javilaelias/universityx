import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import * as mediaCtrl from '../controllers/media.controller';

export const router = Router();

const uploadLimit = rateLimit({
  windowMs: 60_000, max: 10,
  skip: (req) => req.app.get('env') === 'test',
});

router.post('/upload',
  uploadLimit,
  requireAuth,
  requireRole('instructor', 'admin'),
  mediaCtrl.handleUpload,
  mediaCtrl.createUploadJob,
);

router.get('/:id/status',
  requireAuth,
  mediaCtrl.getStatus,
);
