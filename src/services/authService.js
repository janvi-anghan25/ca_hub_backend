import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import userRepository from '../repositories/userRepository.js';
import AppError from '../utils/AppError.js';
import emailService from '../utils/emailService.js';
import logger from '../utils/logger.js';

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

const authService = {
  // ─── Register ────────────────────────────────────────────────────────────────
  async register(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

    const user = await userRepository.create(data);

    // Send welcome email (non-blocking — don't fail registration if email fails)
    emailService.sendWelcomeEmail(user).catch((err) =>
      logger.error('Welcome email failed:', err.message)
    );

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`New user registered: ${user.email}`);
    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(email, password) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    if (!user.isActive) throw new AppError('Account is deactivated. Contact admin.', 403, 'ACCOUNT_INACTIVE');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`User logged in: ${user.email}`);
    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  // ─── Refresh Token ───────────────────────────────────────────────────────────
  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET + '_refresh');
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) throw new AppError('Invalid session', 401, 'INVALID_SESSION');

      const accessToken = generateAccessToken(user._id);
      return { accessToken };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  },

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  async forgotPassword(email) {
    const user = await userRepository.findByEmailWithSecrets(email);

    // Always respond generically to prevent email enumeration
    if (!user || !user.isActive) {
      logger.warn(`Forgot password attempt for unknown/inactive email: ${email}`);
      return;
    }

    const otp = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetOTPEmail(user, otp);
    logger.info(`Password reset OTP sent to: ${email}`);
  },

  // ─── Reset Password ──────────────────────────────────────────────────────────
  async resetPassword(email, otp, newPassword) {
    // Hash the incoming OTP to compare against the stored hash
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await userRepository.findByEmailWithSecrets(email);

    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== hashedOTP
    ) {
      throw new AppError('Invalid OTP. Please request a new one.', 400, 'INVALID_OTP');
    }

    if (user.passwordResetExpires < new Date()) {
      throw new AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email (non-blocking)
    emailService.sendPasswordChangedEmail(user).catch((err) =>
      logger.error('Password changed email failed:', err.message)
    );

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`Password reset successfully for: ${email}`);
    return { user: user.toPublicJSON(), accessToken, refreshToken };
  },

  // ─── Get Profile ─────────────────────────────────────────────────────────────
  async getProfile(userId) {
    const user = await userRepository.findById(userId, { select: '-password' });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    return user;
  },

  // ─── Change Password (authenticated) ─────────────────────────────────────────
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId, { lean: false });
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const freshUser = await userRepository.findByEmail(user.email, true);
    const isValid = await freshUser.comparePassword(currentPassword);
    if (!isValid) throw new AppError('Current password is incorrect', 400, 'WRONG_PASSWORD');

    if (currentPassword === newPassword) {
      throw new AppError('New password must be different from the current password', 400, 'SAME_PASSWORD');
    }

    freshUser.password = newPassword;
    freshUser.mustChangePassword = false;
    await freshUser.save();

    emailService.sendPasswordChangedEmail(freshUser).catch((err) =>
      logger.error('Password changed email failed:', err.message)
    );

    logger.info(`Password changed for user: ${user.email}`);
    return freshUser.toPublicJSON();
  },

  // ─── Create Employee User (by Admin) ─────────────────────────────────────────
  async createEmployeeUser({ name, email, password, mobile }, adminUser) {
    if (!adminUser.office) {
      throw new AppError('Admin is not associated with an office', 400, 'NO_OFFICE');
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

    const employee = await userRepository.create({
      name,
      email,
      password,
      mobile,
      role: 'employee',
      office: adminUser.office,
    });

    emailService.sendWelcomeEmail(employee).catch((err) =>
      logger.error('Welcome email failed for employee:', err.message)
    );

    logger.info(`Admin ${adminUser.email} created employee account: ${email}`);
    return employee.toPublicJSON();
  },

  // ─── Verify Token ────────────────────────────────────────────────────────────
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
  },
};

export default authService;
