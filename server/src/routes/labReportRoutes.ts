import { Router } from 'express';
import { validate, rules } from '../middleware/validate.js';
import { listLabReports, uploadLabReport, uploadMiddleware } from '../controllers/labReportController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', listLabReports);
router.post('/upload', requireRole(['DOCTOR', 'ADMIN']), uploadMiddleware.single('file'), validate(rules.labUpload), uploadLabReport);

export default router;
