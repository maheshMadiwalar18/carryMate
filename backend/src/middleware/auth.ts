import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { verifyFirebaseIdToken } from '../config/firebase';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { UserRole } from '../utils/constants';

export interface AuthedRequest extends Request {
  user?: IUser;
}

/**
 * Resolves the caller's identity from the Authorization header.
 *
 * - Production mode (Firebase configured): expects a Firebase ID token,
 *   verifies it server-side with firebase-admin, and looks up (or lazily
 *   provisions) the matching local User by firebaseUid.
 * - Demo/dev mode (no Firebase credentials): expects a JWT issued by our
 *   own /api/auth/register|login endpoints, signed with JWT_SECRET.
 *
 * The frontend never gets to assert its own user id/role — it's always
 * derived server-side from a verified token.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppError.unauthorized('Missing bearer token');

    let user: IUser | null = null;

    if (env.FIREBASE_CONFIGURED) {
      const decoded = await verifyFirebaseIdToken(token).catch(() => {
        throw AppError.unauthorized('Invalid or expired Firebase token');
      });
      user = await User.findOne({ firebaseUid: decoded.uid });
      if (!user) {
        // First sign-in via Firebase: lazily provision a local profile.
        user = await User.create({
          firebaseUid: decoded.uid,
          name: decoded.name || decoded.email?.split('@')[0] || 'New User',
          email: decoded.email,
          phone: decoded.phone_number,
          profileImage: decoded.picture,
          role: UserRole.BOTH,
        });
      }
    } else {
      let payload: { sub: string };
      try {
        payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      } catch {
        throw AppError.unauthorized('Invalid or expired session token');
      }
      user = await User.findById(payload.sub);
    }

    if (!user) throw AppError.unauthorized('User not found');
    if (user.isSuspended) throw AppError.forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (roles.includes(req.user.role) || req.user.role === UserRole.ADMIN) return next();
    return next(AppError.forbidden('This action requires a different account role'));
  };
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role !== UserRole.ADMIN) return next(AppError.forbidden('Admin access required'));
  next();
}
