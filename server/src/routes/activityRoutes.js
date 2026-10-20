import { Router } from 'express';
import { getActivities } from '../controllers/activityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getActivities);

export default router;
