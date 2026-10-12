import { Router } from 'express';
import { getSubmissions, respondToSubmission } from '../controllers/submissionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSubmissions);
router.patch('/:id', requireRole('admin'), respondToSubmission);

export default router;
