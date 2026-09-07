import { Notification, NotificationType } from '../models/Notification';
import { Types } from 'mongoose';

export async function notify(userId: Types.ObjectId | string, type: NotificationType, title: string, body: string, relatedId?: Types.ObjectId | string) {
  return Notification.create({ userId, type, title, body, relatedId });
}
