import { RequestHandler, Router } from 'express';
import { getPrescriptionById, listPrescriptions, downloadPrescriptionPDF } from '../controllers/prescriptionController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Browser downloads may pass the token as ?token= (see the deferred item in docs); access is still checked per record
const tokenFromQuery: RequestHandler = (req, _res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};
router.get('/:id/pdf', tokenFromQuery, authenticateJWT, downloadPrescriptionPDF);
router.post('/:id/pdf', authenticateJWT, downloadPrescriptionPDF); // path named in the proposal API table

router.use(authenticateJWT);
router.get('/', listPrescriptions);
router.get('/:id', getPrescriptionById);

export default router;
