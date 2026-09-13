import { Router } from 'express';
import { getPrescriptionById, listPrescriptions, downloadPrescriptionPDF } from '../controllers/prescriptionController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Allow public or token-based PDF download (if token passed via header or query parameter for browser downloads)
router.get('/:id/pdf', (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticateJWT, downloadPrescriptionPDF);

router.use(authenticateJWT);
router.get('/', listPrescriptions);
router.get('/:id', getPrescriptionById);

export default router;
