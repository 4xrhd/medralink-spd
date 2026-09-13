import { Router } from 'express';
import { listDoctors, getDoctorById, verifyDoctor } from '../controllers/doctorController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.patch('/:id/verify', requireRole(['ADMIN']), verifyDoctor);

export default router;
