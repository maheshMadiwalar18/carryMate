import { Response } from 'express';
import { User } from '../models/User';
import { Rating } from '../models/Rating';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';

/** Public-safe profile view — no email/phone leaked to other users. */
export const getPublicProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');

  const isSelf = req.user && req.user._id.equals(user._id);
  const data = {
    _id: user._id,
    name: user.name,
    profileImage: user.profileImage,
    bio: user.bio,
    rating: user.rating,
    totalRatings: user.totalRatings,
    completedTrips: user.completedTrips,
    completedDeliveries: user.completedDeliveries,
    verificationStatus: user.verificationStatus,
    trustScore: user.trustScore,
    createdAt: user.createdAt,
    ...(isSelf ? { email: user.email, phone: user.phone, role: user.role } : {}),
  };

  res.json({ success: true, data });
});

export const getUserRatings = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const ratings = await Rating.find({ revieweeId: req.params.id })
    .populate('reviewerId', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, data: ratings });
});
