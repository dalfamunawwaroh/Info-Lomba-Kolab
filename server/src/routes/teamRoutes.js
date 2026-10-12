import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMembers,
} from '../controllers/teamController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', createTeam);
router.patch('/:id', updateTeam);
router.delete('/:id', deleteTeam);
router.patch('/:id/members', updateMembers);

export default router;
