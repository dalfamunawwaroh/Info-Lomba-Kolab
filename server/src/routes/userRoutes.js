import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', requireRole('admin'), createUser);
router.patch('/:id', updateUser);
router.patch('/:id/activate', requireRole('admin'), activateUser);
router.patch('/:id/deactivate', requireRole('admin'), deactivateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
