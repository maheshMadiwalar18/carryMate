import { User } from '../models/User';
import { Types } from 'mongoose';

/** Recomputes a user's derived trustScore from rating + completion history. */
export async function recalculateTrustScore(userId: Types.ObjectId | string) {
  const user = await User.findById(userId);
  if (!user) return;

  const ratingComponent = (user.rating / 5) * 50; // up to 50
  const experienceComponent = Math.min(user.completedTrips + user.completedDeliveries, 30); // up to 30
  const verificationComponent = user.verificationStatus === 'VERIFIED' ? 20 : 0;

  user.trustScore = Math.round(Math.min(100, ratingComponent + experienceComponent + verificationComponent));
  await user.save();
}

export async function applyRating(revieweeId: Types.ObjectId | string, newRating: number) {
  const user = await User.findById(revieweeId);
  if (!user) return;
  const totalPoints = user.rating * user.totalRatings + newRating;
  user.totalRatings += 1;
  user.rating = Math.round((totalPoints / user.totalRatings) * 10) / 10;
  await user.save();
  await recalculateTrustScore(user._id);
}
