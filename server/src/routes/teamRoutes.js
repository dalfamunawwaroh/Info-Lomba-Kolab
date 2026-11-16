import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  updateMembers,
} from '../controllers/teamController.js';
import {
  getMyTeams,
  updateTeamByLeader,
  requestAdvisor,
  cancelAdvisorRequest,
  cancelTeamRegistration,
  cancelSoloRegistration,
} from '../controllers/studentTeamController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTeams);
// Aksi mahasiswa atas tim miliknya (didaftarkan sebelum '/:id')
router.get('/mine', requireRole('mahasiswa'), getMyTeams);
router.delete('/solo/:regId', requireRole('mahasiswa'), cancelSoloRegistration);
router.patch('/:id/leader', requireRole('mahasiswa'), updateTeamByLeader);
router.post('/:id/advisor-request', requireRole('mahasiswa'), requestAdvisor);
router.delete('/:id/advisor-request', requireRole('mahasiswa'), cancelAdvisorRequest);
router.delete('/:id/registration', requireRole('mahasiswa'), cancelTeamRegistration);
router.get('/:id', getTeamById);
// Hanya admin (Kelola Tim) yang boleh membuat/mengubah/menghapus tim.
router.post('/', requireRole('admin'), createTeam);
router.patch('/:id', requireRole('admin'), updateTeam);
router.delete('/:id', requireRole('admin'), deleteTeam);
router.patch('/:id/members', requireRole('admin'), updateMembers);

export default router;
