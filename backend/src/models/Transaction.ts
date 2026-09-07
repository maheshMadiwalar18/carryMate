import { Schema, model, Document, Types } from 'mongoose';
import { TransactionStatus } from '../utils/constants';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  deliveryRequestId: Types.ObjectId;
  requesterId: Types.ObjectId;
  travelerId: Types.ObjectId;
  amount: number;
  platformFee: number;
  travelerAmount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: TransactionStatus;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    deliveryRequestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    travelerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    travelerAmount: { type: Number, required: true },
    razorpayOrderId: { type: String, index: true, sparse: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String, select: false },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.CREATED, index: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
