import { Router } from 'express';
import { createConsultation, getConsultationById, downloadConsultationPDF } from '../controllers/consultationController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Allow token passed via query parameter for direct browser PDF downloads
router.get('/:id/pdf', (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticateJWT, downloadConsultationPDF);

router.use(authenticateJWT);

router.post('/', requireRole(['DOCTOR', 'ADMIN']), createConsultation);
router.get('/:id', getConsultationById);

export default router;
