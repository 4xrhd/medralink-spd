import { Router } from 'express';
import { searchPatients, getPatientById, getPatientTimeline } from '../controllers/patientController.js';
import { downloadPatientSummaryPDF } from '../controllers/consultationController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Allow token passed via query parameter for direct browser PDF downloads
router.get('/:id/summary/pdf', (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticateJWT, downloadPatientSummaryPDF);

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'DOCTOR']), searchPatients);
router.get('/:id', getPatientById);
router.get('/:id/timeline', getPatientTimeline);

export default router;
