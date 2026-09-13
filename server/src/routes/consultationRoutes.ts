import { Router } from 'express';
import { createConsultation, getConsultationById } from '../controllers/consultationController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT);

router.post('/', requireRole(['DOCTOR', 'ADMIN']), createConsultation);
router.get('/:id', getConsultationById);

export default router;
