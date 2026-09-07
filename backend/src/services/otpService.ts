import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Otp } from '../models/Otp';
import { OtpType } from '../utils/constants';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

const OTP_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generates a fresh OTP for a delivery stage. The plaintext code is returned
 * ONLY to the immediate caller (so it can be shown to the requester, who
 * hands it to the traveler in person) — it is never persisted in plaintext
 * and never exposed by any GET endpoint.
 */
export async function generateOtp(deliveryRequestId: Types.ObjectId | string, type: OtpType) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any previous unverified OTP of the same type for this delivery.
  await Otp.deleteMany({ deliveryRequestId, type, verifiedAt: { $exists: false } });

  const otp = await Otp.create({ deliveryRequestId, type, codeHash, expiresAt, maxAttempts: MAX_ATTEMPTS });
  return { otpId: otp._id, code, expiresAt };
}

export async function verifyOtp(deliveryRequestId: Types.ObjectId | string, type: OtpType, code: string) {
  const otp = await Otp.findOne({ deliveryRequestId, type }).sort({ _id: -1 }).select('+codeHash');
  if (!otp) throw AppError.notFound('No OTP has been generated for this stage yet', 'OTP_NOT_FOUND');
  if (otp.verifiedAt) throw AppError.conflict('This OTP has already been verified', 'OTP_ALREADY_VERIFIED');
  if (otp.expiresAt.getTime() < Date.now()) throw new AppError('OTP has expired, please request a new one', 410, 'OTP_EXPIRED');
  if (otp.attempts >= otp.maxAttempts) throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429, 'OTP_ATTEMPTS_EXCEEDED');

  const isMatch = await bcrypt.compare(code, otp.codeHash);
  if (!isMatch) {
    otp.attempts += 1;
    await otp.save();
    throw AppError.validation('Incorrect OTP code');
  }

  otp.verifiedAt = new Date();
  await otp.save();
  return otp;
}
