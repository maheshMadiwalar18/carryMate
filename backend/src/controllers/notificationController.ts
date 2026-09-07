import { Response } from 'express';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';

export const listMyNotifications = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const notifications = await Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 }).limit(100);
  const unreadCount = await Notification.countDocuments({ userId: req.user!._id, read: false });
  res.json({ success: true, data: notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user!._id }, { read: true });
  res.json({ success: true });
});
