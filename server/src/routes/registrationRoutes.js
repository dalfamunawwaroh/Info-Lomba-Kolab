import { Router } from 'express';
import { getRegistrations, assignRegistration } from '../controllers/registrationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRole('admin'), getRegistrations);
router.post('/:id/assign', requireRole('admin'), assignRegistration);

export default router;
