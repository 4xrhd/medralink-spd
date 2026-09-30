import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteSingleNotification,
  clearAll,
  getSettings,
  updateSettings
} from '../controllers/notificationController.js';

const router = Router();

// Enforce JWT authentication on all notification routes
router.use(authenticateJWT);

router.get('/', getNotifications);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-all', clearAll);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteSingleNotification);

export default router;
