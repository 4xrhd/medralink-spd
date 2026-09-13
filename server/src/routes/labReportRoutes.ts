import { Router } from 'express';
import { listLabReports, uploadLabReport, uploadMiddleware } from '../controllers/labReportController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listLabReports);
router.post('/upload', requireRole(['DOCTOR', 'ADMIN']), uploadMiddleware.single('file'), uploadLabReport);

export default router;
