import { Router } from 'express';
import { listUsers, updateUserStatus, getSettings, updateSettings } from '../controllers/adminController.js';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate, rules } from '../middleware/validate.js';

const router = Router();
router.use(authenticateJWT, requireRole(['ADMIN']));

router.get('/users', listUsers);
router.patch('/users/:id', validate(rules.adminUserUpdate), updateUserStatus);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/audit-logs', validate(rules.auditFilters), getAuditLogs);

export default router;
