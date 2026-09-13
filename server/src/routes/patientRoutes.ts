import { Router } from 'express';
import { searchPatients, getPatientById, getPatientTimeline } from '../controllers/patientController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'DOCTOR']), searchPatients);
router.get('/:id', getPatientById);
router.get('/:id/timeline', getPatientTimeline);

export default router;
