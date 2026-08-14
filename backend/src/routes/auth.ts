import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { authRateLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema, createUserSchema, updateUserSchema } from '../schemas/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/register/:token', authController.registerWithInvitation);
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/me', authenticate, authController.updateCurrentUser);
router.post('/create-user', authenticate, requireAdmin, validateBody(createUserSchema), authController.createUser);
router.get('/users', authenticate, requireAdmin, authController.listUsersByRole);
router.get('/users/:id', authenticate, requireAdmin, authController.getUserById);
router.put('/users/:id', authenticate, requireAdmin, validateBody(updateUserSchema), auditLog('users'), authController.updateUser);
router.delete('/users/:id', authenticate, requireAdmin, auditLog('users'), authController.deleteUser);

export default router;
