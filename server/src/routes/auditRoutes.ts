import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT, requireRole(['ADMIN']));

router.get('/', getAuditLogs);

export default router;
