import { Router } from 'express';
import { login, register, checkAvailability, refreshToken, logout, me, requestPasswordReset, resetPasswordWithCode } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/check-availability', checkAvailability);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

// Alur reset password (tanpa login):
// 1) user ajukan lewat email terdaftar → 2) admin kirim kode (via /admin/resets/:id/send-code)
// 3) user verifikasi kode + password baru di sini
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithCode);

export default router;
