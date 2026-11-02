import { Router } from 'express';
import { getUserHistory } from '../controllers/historyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Semua role terautentikasi boleh membaca riwayat (ProfilePage admin boleh
// melihat riwayat user lain yang sedang dibukanya).
router.get('/:id', getUserHistory);

export default router;
