import { Router } from 'express';
import { getActivities } from '../controllers/activityController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
// Log aktivitas sistem hanya untuk admin.
router.get('/', requireRole('admin'), getActivities);

export default router;
