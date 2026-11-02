import { Router } from 'express';
import { getDirectory } from '../controllers/directoryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDirectory);

export default router;
