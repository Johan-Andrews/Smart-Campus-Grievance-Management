import { Router } from 'express';
import { draftCoach } from '../controllers/ai.controller';

const router = Router();

router.post('/draft-coach', draftCoach);

export default router;
