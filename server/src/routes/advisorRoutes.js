import { Router } from 'express';
import {
  getAdvisorRequests,
  respondToRequest,
  selfAssign,
  assignByAdmin,
  replaceAdvisor,
  getMyTeams,
  getMyTeamDetail,
  getAdvisorSummary,
  getTeamsNeedingAdvisor,
  getMyRequests,
  requestAdvisor,
  cancelAdvisorRequest,
  getTeamAdvisorRequests,
  createTeamChangeRequest,
  getMyChangeRequests,
} from '../controllers/advisorController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Ringkasan dashboard dosen
router.get('/summary', requireRole('dosen'), getAdvisorSummary);

// Pengajuan pembimbing
router.get('/requests', getAdvisorRequests);
router.delete('/requests/:id/cancel', requireRole('mahasiswa'), cancelAdvisorRequest);
router.post('/requests/:id/cancel', requireRole('mahasiswa'), cancelAdvisorRequest);
router.patch('/requests/:id', respondToRequest);
router.post('/request', requireRole('mahasiswa'), requestAdvisor);
router.get('/team-requests', requireRole('mahasiswa'), getTeamAdvisorRequests);
router.post('/self-assign', requireRole('dosen'), selfAssign);

// Tim yang masih butuh pembimbing + pengajuan diri milik dosen
router.get('/teams-needing', requireRole('dosen'), getTeamsNeedingAdvisor);
router.get('/my-requests', requireRole('dosen'), getMyRequests);

// Tim bimbingan
router.get('/my-teams', getMyTeams);
router.get('/teams/:id', getMyTeamDetail);

// Pengajuan perubahan tim oleh dosen (F-14)
router.post('/teams/:id/change-request', createTeamChangeRequest);
router.get('/change-requests', getMyChangeRequests);

// Khusus admin
router.post('/assign', requireRole('admin'), assignByAdmin);
router.patch('/:id/replace', requireRole('admin'), replaceAdvisor);

export default router;
