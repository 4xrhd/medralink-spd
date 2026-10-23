import { Router } from 'express';
import { validate, rules } from '../middleware/validate.js';
import { login, register, getMe } from '../controllers/authController.js';
import { updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/accountController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();
router.post('/login', validate(rules.login), login);
router.post('/register', validate(rules.register), register);
router.get('/me', authenticateJWT, getMe);
router.put('/me', authenticateJWT, validate(rules.updateProfile), updateProfile);
router.put('/password', authenticateJWT, validate(rules.changePassword), changePassword);
router.post('/forgot-password', validate(rules.forgotPassword), forgotPassword);
router.post('/reset-password', validate(rules.resetPassword), resetPassword);

export default router;
