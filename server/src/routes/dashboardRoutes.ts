import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
router.use(authenticateJWT);

router.get('/', getDashboardStats);

export default router;
