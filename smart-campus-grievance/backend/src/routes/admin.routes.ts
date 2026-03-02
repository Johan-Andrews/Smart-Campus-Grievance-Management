import { Router } from 'express';
import { getModerationQueue, getAnalytics } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

router.get('/moderation', getModerationQueue);
router.get('/analytics', getAnalytics);

export default router;
