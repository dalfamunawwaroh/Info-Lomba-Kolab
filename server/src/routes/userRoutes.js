import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
  resetPassword,
  sendMessageToUser,
  getUserMessages,
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
router.patch('/:id/reset-password', requireRole('admin'), resetPassword);
router.post('/:id/message', requireRole('admin'), sendMessageToUser);
router.get('/:id/messages', requireRole('admin'), getUserMessages);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
