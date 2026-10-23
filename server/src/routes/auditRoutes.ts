import { Router } from 'express';
import { validate, rules } from '../middleware/validate.js';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authenticateJWT, requireRole(['ADMIN']));

router.get('/', validate(rules.auditFilters), getAuditLogs);

export default router;
