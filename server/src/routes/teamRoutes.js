import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMembers,
} from '../controllers/teamController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeams);
router.get('/:id', getTeamById);
// Hanya admin (Kelola Tim) yang boleh membuat/mengubah/menghapus tim.
router.post('/', requireRole('admin'), createTeam);
router.patch('/:id', requireRole('admin'), updateTeam);
router.delete('/:id', requireRole('admin'), deleteTeam);
router.patch('/:id/members', requireRole('admin'), updateMembers);

export default router;
