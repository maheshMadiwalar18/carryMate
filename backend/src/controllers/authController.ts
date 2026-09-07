import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { UserRole } from '../utils/constants';

function issueToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

/**
 * Demo-mode registration (used when Firebase is not configured). In a real
 * deployment with Firebase configured, registration/login happens client-side
 * via the Firebase SDK and this endpoint is not used — the client instead
 * calls POST /api/auth/profile with a verified Firebase ID token to sync the
 * local profile.
 */
export const register = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (env.FIREBASE_CONFIGURED) {
    throw AppError.forbidden('Registration is handled by Firebase Authentication on this deployment', 'USE_FIREBASE_AUTH');
  }
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, phone, role: UserRole.BOTH });
  const token = issueToken(user._id.toString());

  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (env.FIREBASE_CONFIGURED) {
    throw AppError.forbidden('Login is handled by Firebase Authentication on this deployment', 'USE_FIREBASE_AUTH');
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.passwordHash) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');

  const token = issueToken(user._id.toString());
  res.json({ success: true, data: { user, token } });
});

/** Returns/refreshes the caller's own profile, based on the verified token identity. */
export const getOrSyncProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  Object.assign(user, req.body);
  await user.save();
  res.json({ success: true, data: user });
});
