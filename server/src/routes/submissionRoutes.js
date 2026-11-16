import { Router } from 'express';
import { getSubmissions, respondToSubmission } from '../controllers/submissionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Monitoring pengajuan hanya untuk admin — berisi data pribadi pemohon.
router.get('/', requireRole('admin'), getSubmissions);
router.patch('/:id', requireRole('admin'), respondToSubmission);

export default router;
