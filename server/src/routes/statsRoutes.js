import { Router } from 'express';
import { getAdminStats } from '../controllers/statsController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', requireRole('admin'), getAdminStats);

export default router;
