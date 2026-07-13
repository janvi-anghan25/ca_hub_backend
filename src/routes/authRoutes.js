import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
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
router.post('/register', sensitiveActionLimiter, validate(registerSchema), register);
router.post('/login', sensitiveActionLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);

// Forgot / Reset password
router.post('/forgot-password', sensitiveActionLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', sensitiveActionLimiter, validate(resetPasswordSchema), resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
