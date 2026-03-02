import { Router } from 'express';
import { draftCoach } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/draft-coach', authenticateToken, draftCoach);

export default router;
