import { Router } from 'express';
import { getBroadcasts, createBroadcast, deleteBroadcast } from '../controllers/broadcastController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getBroadcasts);
router.post('/', requireRole('admin'), createBroadcast);
router.delete('/:id', requireRole('admin'), deleteBroadcast);

export default router;
