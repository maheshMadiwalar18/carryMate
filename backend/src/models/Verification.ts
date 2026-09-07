import { Schema, model, Document, Types } from 'mongoose';
import { VerificationStatus } from '../utils/constants';

export interface IVerification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  verificationType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'SELFIE';
  documentType: string;
  documentUrl: string;
  status: VerificationStatus;
  reviewerNote?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

const verificationSchema = new Schema<IVerification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  verificationType: { type: String, enum: ['ID_PROOF', 'ADDRESS_PROOF', 'SELFIE'], required: true },
  documentType: { type: String, required: true },
  documentUrl: { type: String, required: true },
  status: { type: String, enum: Object.values(VerificationStatus), default: VerificationStatus.PENDING, index: true },
  reviewerNote: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

export const Verification = model<IVerification>('Verification', verificationSchema);
