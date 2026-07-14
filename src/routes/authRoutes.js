import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
  logout,
  createEmployeeUser,
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createEmployeeSchema,
} from '../validators/authValidator.js';

const router = Router();

// Strict rate limiter for sensitive auth actions
const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

// ─── Public routes ────────────────────────────────────────────────────────────
// Public self-registration is disabled. Admins are created by Super Admin only.
router.post('/register', (_req, res) => {
  res.status(403).json({
    success: false,
    message: 'Public registration is disabled. Contact your Super Admin to get an account.',
    errorCode: 'REGISTRATION_DISABLED',
  });
});

router.post('/login', sensitiveActionLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);

// Forgot / Reset password
router.post('/forgot-password', sensitiveActionLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', sensitiveActionLimiter, validate(resetPasswordSchema), resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

// Admin creates an employee account within their own office
router.post(
  '/create-employee',
  protect,
  restrictTo('admin', 'superadmin'),
  validate(createEmployeeSchema),
  createEmployeeUser
);

export default router;
