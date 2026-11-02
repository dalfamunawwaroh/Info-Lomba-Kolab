import { Router } from 'express';
import { getStartups, createStartup, updateStartup, deleteStartup } from '../controllers/startupController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// GET publik: dibutuhkan form register (dropdown startup) tanpa login
router.get('/', getStartups);

router.use(authenticateToken);
router.post('/', requireRole('admin'), createStartup);
router.patch('/:id', requireRole('admin'), updateStartup);
router.delete('/:id', requireRole('admin'), deleteStartup);

export default router;
