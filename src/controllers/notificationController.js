import Notification from '../models/Notification.js';
import Employee from '../models/Employee.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

const getRecipientIds = async (userId) => {
  const recipientIds = [userId];
  const employee = await Employee.findOne({ user: userId }).lean();
  if (employee) {
    recipientIds.push(employee._id);
  }
  return recipientIds;
};

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const recipientIds = await getRecipientIds(req.user.id);
  const filter = { recipient: { $in: recipientIds } };
  if (unread === 'true') filter.isRead = false;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
  ]);
  paginatedResponse(res, data, total, page, limit, 'Notifications fetched');
});

export const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  successResponse(res, null, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const recipientIds = await getRecipientIds(req.user.id);
  await Notification.updateMany(
    { recipient: { $in: recipientIds }, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  successResponse(res, null, 'All notifications marked as read');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const recipientIds = await getRecipientIds(req.user.id);
  const count = await Notification.countDocuments({ recipient: { $in: recipientIds }, isRead: false });
  successResponse(res, { count }, 'Unread count fetched');
});
