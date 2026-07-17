import Office from '../models/Office.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  if (name !== undefined) user.name = name.trim();
  if (mobile !== undefined) user.mobile = mobile;

  await user.save({ validateBeforeSave: false });

  logger.info(`User ${user.email} updated their profile`);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.twoFactorSecret;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;

  successResponse(res, userObj, 'Profile updated successfully');
});

export const getMyOffice = asyncHandler(async (req, res) => {
  if (!req.user.office) {
    throw new AppError('No office associated with this account', 404, 'NO_OFFICE');
  }
  const office = await Office.findById(req.user.office).lean();
  if (!office) throw new AppError('Office not found', 404, 'OFFICE_NOT_FOUND');

  successResponse(res, office, 'Office settings fetched');
});

export const updateMyOffice = asyncHandler(async (req, res) => {
  if (!req.user.office) {
    throw new AppError('No office associated with this account', 404, 'NO_OFFICE');
  }

  const allowedFields = [
    'name', 'mobile', 'email', 'gstNumber', 'panNumber',
    'invoicePrefix', 'financialYearStart', 'address',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const office = await Office.findByIdAndUpdate(
    req.user.office,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!office) throw new AppError('Office not found', 404, 'OFFICE_NOT_FOUND');

  logger.info(`Admin ${req.user.email} updated office settings for: ${office.name}`);
  successResponse(res, office, 'Office settings updated successfully');
});
