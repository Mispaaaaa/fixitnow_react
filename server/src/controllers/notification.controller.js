import { Notification } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, pagedData } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 20);
  const where = { userId: req.user.id };
  if (req.query.unread === 'true') where.readAt = null;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  const unread = await Notification.count({ where: { userId: req.user.id, readAt: null } });

  res.json({
    success: true,
    message: 'OK',
    data: { ...pagedData(rows, count, page, limit), unread },
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.count({ where: { userId: req.user.id, readAt: null } });
  res.json({ success: true, message: 'OK', data: { count } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notification) throw ApiError.notFound('Notification not found');
  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }
  res.json({ success: true, message: 'Marked as read', data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.update(
    { readAt: new Date() },
    { where: { userId: req.user.id, readAt: null } }
  );
  res.json({ success: true, message: 'All notifications marked as read', data: null });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notification) throw ApiError.notFound('Notification not found');
  await notification.update({ deletedBy: req.user.id });
  await notification.destroy();
  res.json({ success: true, message: 'Notification removed', data: null });
});