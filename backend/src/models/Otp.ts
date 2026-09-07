import { Schema, model, Document, Types } from 'mongoose';
import { OtpType } from '../utils/constants';

export interface IOtp extends Document {
  _id: Types.ObjectId;
  deliveryRequestId: Types.ObjectId;
  type: OtpType;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  verifiedAt?: Date;
}

const otpSchema = new Schema<IOtp>({
  deliveryRequestId: { type: Schema.Types.ObjectId, ref: 'DeliveryRequest', required: true, index: true },
  type: { type: String, enum: Object.values(OtpType), required: true },
  // OTP is stored hashed, never returned via API in plaintext.
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true },
  verifiedAt: { type: Date },
});

otpSchema.index({ deliveryRequestId: 1, type: 1 });

otpSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.codeHash;
    return ret;
  },
});

export const Otp = model<IOtp>('Otp', otpSchema);
