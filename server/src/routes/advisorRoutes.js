import { Router } from 'express';
import {
  getAdvisorRequests,
  respondToRequest,
  selfAssign,
  assignByAdmin,
  replaceAdvisor,
  getMyTeams,
} from '../controllers/advisorController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/requests', getAdvisorRequests);
router.patch('/requests/:id', respondToRequest);
router.post('/self-assign', selfAssign);
router.post('/assign', requireRole('admin'), assignByAdmin);
router.patch('/:id/replace', requireRole('admin'), replaceAdvisor);
router.get('/my-teams', getMyTeams);

export default router;
