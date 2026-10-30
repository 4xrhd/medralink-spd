import { Router } from 'express';
import { validate, rules } from '../middleware/validate.js';
import { createConsultation, getConsultationById, downloadConsultationPDF } from '../controllers/consultationController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// PDFs are fetched with the Authorization header; tokens are never accepted in the URL
router.get('/:id/pdf', authenticateJWT, downloadConsultationPDF);

router.use(authenticateJWT);

router.post('/', requireRole(['DOCTOR', 'ADMIN']), validate(rules.consultation), createConsultation);
router.get('/:id', getConsultationById);

export default router;
