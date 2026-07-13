import authService from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, role } = req.body;
  const result = await authService.register({ name, email, password, mobile, role });
  setRefreshCookie(res, result.refreshToken);
  successResponse(res, { user: result.user, accessToken: result.accessToken }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setRefreshCookie(res, result.refreshToken);
  successResponse(res, { user: result.user, accessToken: result.accessToken }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.refreshToken(token);
  successResponse(res, result, 'Token refreshed');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  // Always return the same message to prevent email enumeration attacks
  successResponse(
    res,
    null,
    'If an account with that email exists, a password reset OTP has been sent.'
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPassword(email, otp, newPassword);
  setRefreshCookie(res, result.refreshToken);
  successResponse(res, { user: result.user, accessToken: result.accessToken }, 'Password reset successfully');
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  successResponse(res, user, 'Profile fetched');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  successResponse(res, null, 'Password changed successfully');
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  successResponse(res, null, 'Logged out successfully');
});
