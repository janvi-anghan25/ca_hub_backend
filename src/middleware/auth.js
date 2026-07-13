import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw new AppError('Authentication required. Please log in.', 401, 'NO_TOKEN');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token. Please log in again.', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.id).select('-password').lean();
  if (!user) throw new AppError('User no longer exists', 401, 'USER_NOT_FOUND');
  if (!user.isActive) throw new AppError('Account deactivated. Contact administrator.', 403, 'ACCOUNT_INACTIVE');

  req.user = { ...user, id: user._id.toString() };
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN');
    }
    next();
  };
};
