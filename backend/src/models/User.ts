import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, VerificationStatus } from '../utils/constants';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid?: string;
  name: string;
  email: string;
  passwordHash?: string; // only used in demo-auth mode
  phone?: string;
  profileImage?: string;
  role: UserRole;
  bio?: string;
  rating: number;
  totalRatings: number;
  completedTrips: number;
  completedDeliveries: number;
  verificationStatus: VerificationStatus;
  trustScore: number;
  isSuspended: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, index: true, sparse: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, select: false },
    phone: { type: String, trim: true, index: true, sparse: true },
    profileImage: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.BOTH },
    bio: { type: String, maxlength: 500 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    completedTrips: { type: Number, default: 0, min: 0 },
    completedDeliveries: { type: Number, default: 0, min: 0 },
    verificationStatus: { type: String, enum: Object.values(VerificationStatus), default: VerificationStatus.UNVERIFIED },
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    isSuspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Never leak password hashes even if `select` guard is bypassed by a bad query.
userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
