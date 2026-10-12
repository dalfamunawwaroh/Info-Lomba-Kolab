import { Router } from 'express';
import {
  getCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  registerToCompetition,
  getSoloRegistrations,
} from '../controllers/competitionController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getCompetitions);
router.get('/:id', getCompetitionById);
router.post('/', requireRole('admin'), createCompetition);
router.patch('/:id', requireRole('admin'), updateCompetition);
router.delete('/:id', requireRole('admin'), deleteCompetition);
router.post('/:id/register', registerToCompetition);
router.get('/:id/solo', getSoloRegistrations);

export default router;
