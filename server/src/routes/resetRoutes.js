import { Router } from 'express';
import { getResetRequests, sendResetCode, cancelResetRequest } from '../controllers/resetController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/', getResetRequests);
router.post('/:id/send-code', sendResetCode);
router.post('/:id/cancel', cancelResetRequest);

export default router;
