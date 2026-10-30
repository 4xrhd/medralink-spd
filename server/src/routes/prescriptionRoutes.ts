import { Router } from 'express';
import { getPrescriptionById, listPrescriptions, downloadPrescriptionPDF } from '../controllers/prescriptionController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// PDFs are fetched with the Authorization header; tokens are never accepted in the URL
router.get('/:id/pdf', authenticateJWT, downloadPrescriptionPDF);
router.post('/:id/pdf', authenticateJWT, downloadPrescriptionPDF); // path named in the proposal API table

router.use(authenticateJWT);
router.get('/', listPrescriptions);
router.get('/:id', getPrescriptionById);

export default router;
