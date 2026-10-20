import { Router } from 'express';
import { getNotifications, markAllRead } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getNotifications);
router.patch('/read-all', markAllRead);

export default router;
