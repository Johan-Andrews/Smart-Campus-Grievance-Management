import { Router } from 'express';
import { submitComplaint, getComplaints, getComplaintById, updateComplaintStatus } from '../controllers/complaint.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, requireRole(['STUDENT']), submitComplaint);
router.get('/', authenticateToken, getComplaints);
router.get('/:id', authenticateToken, getComplaintById);
router.put('/:id/status', authenticateToken, requireRole(['FACULTY', 'ADMIN']), updateComplaintStatus);

export default router;
