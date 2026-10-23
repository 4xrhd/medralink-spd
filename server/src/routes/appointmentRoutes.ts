import { Router } from 'express';
import { validate, rules } from '../middleware/validate.js';
import { createAppointment, listAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listAppointments);
router.post('/', validate(rules.appointment), createAppointment);
router.patch('/:id/status', validate(rules.appointmentStatus), updateAppointmentStatus);

export default router;
