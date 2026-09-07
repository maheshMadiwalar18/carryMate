import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  reportedUserId?: Types.ObjectId;
  deliveryRequestId?: Types.ObjectId;
  reason: string;
  details?: string;
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    deliveryRequestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest' },
    reason: { type: String, required: true },
    details: { type: String, maxlength: 2000 },
    status: { type: String, enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'], default: 'OPEN', index: true },
  },
  { timestamps: true }
);

export const Report = model<IReport>('Report', reportSchema);
