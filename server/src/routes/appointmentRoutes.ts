import { Router } from 'express';
import { createAppointment, listAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listAppointments);
router.post('/', createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
