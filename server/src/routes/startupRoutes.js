import { Router } from 'express';
import { getStartups, createStartup, updateStartup, deleteStartup } from '../controllers/startupController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getStartups);
router.post('/', requireRole('admin'), createStartup);
router.patch('/:id', requireRole('admin'), updateStartup);
router.delete('/:id', requireRole('admin'), deleteStartup);

export default router;
