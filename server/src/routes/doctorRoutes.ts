import { Router } from 'express';
import { listDoctors, getDoctorById, verifyDoctor } from '../controllers/doctorController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, rules } from '../middleware/validate.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.patch('/:id/verify', requireRole(['ADMIN']), validate(rules.doctorVerify), verifyDoctor);

export default router;
