import { Router } from 'express';
import { login, register, refreshToken, logout, me } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

export default router;
