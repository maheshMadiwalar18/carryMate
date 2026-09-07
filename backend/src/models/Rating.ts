import { Schema, model, Document, Types } from 'mongoose';

export interface IRating extends Document {
  _id: Types.ObjectId;
  deliveryRequestId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  revieweeId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    deliveryRequestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate ratings: one reviewer can rate one reviewee once per delivery.
ratingSchema.index({ deliveryRequestId: 1, reviewerId: 1 }, { unique: true });

export const Rating = model<IRating>('Rating', ratingSchema);
