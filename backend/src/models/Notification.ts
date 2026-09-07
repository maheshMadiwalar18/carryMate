import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType =
  | 'NEW_MATCH' | 'TRAVELER_ACCEPTED' | 'REQUESTER_SELECTED' | 'PAYMENT_SUCCESSFUL'
  | 'PICKUP_REMINDER' | 'ITEM_PICKED_UP' | 'IN_TRANSIT' | 'DELIVERY_COMPLETED'
  | 'CANCELLATION' | 'RATING_RECEIVED' | 'DISPUTE';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    relatedId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = model<INotification>('Notification', notificationSchema);
