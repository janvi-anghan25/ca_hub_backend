import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const filter = { recipient: req.user.id };
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
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  successResponse(res, null, 'All notifications marked as read');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
  successResponse(res, { count }, 'Unread count fetched');
});
