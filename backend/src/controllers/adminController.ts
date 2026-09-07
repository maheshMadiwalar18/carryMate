import { Response } from 'express';
import { User } from '../models/User';
import { Trip } from '../models/Trip';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { Delivery } from '../models/Delivery';
import { Transaction } from '../models/Transaction';
import { Verification } from '../models/Verification';
import { Report } from '../models/Report';
import { PlatformSettings } from '../models/PlatformSettings';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { DeliveryState, RequestStatus, TransactionStatus, VerificationStatus } from '../utils/constants';
import { env } from '../config/env';

export async function getPlatformFeePercent(): Promise<number> {
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { platformFeePercent: env.DEFAULT_PLATFORM_FEE_PERCENT } },
    { upsert: true, new: true }
  );
  return settings.platformFeePercent;
}

export const getAnalytics = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const [totalUsers, activeTravelers, activeRequests, completedDeliveries, settledTx, allTx, cancelledDeliveries, totalDeliveries] = await Promise.all([
    User.countDocuments(),
    Trip.distinct('travelerId', { status: 'ACTIVE' }).then((a) => a.length),
    DeliveryRequest.countDocuments({ status: RequestStatus.OPEN }),
    Delivery.countDocuments({ state: DeliveryState.COMPLETED }),
    Transaction.aggregate([{ $match: { status: { $in: [TransactionStatus.PAID, TransactionStatus.SETTLED] } } }, { $group: { _id: null, gmv: { $sum: '$amount' }, revenue: { $sum: '$platformFee' } } }]),
    Transaction.countDocuments(),
    Delivery.countDocuments({ state: DeliveryState.CANCELLED }),
    Delivery.countDocuments(),
  ]);

  const ratingAgg = await User.aggregate([
    { $match: { totalRatings: { $gt: 0 } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } },
  ]);

  const gmv = settledTx[0]?.gmv || 0;
  const revenue = settledTx[0]?.revenue || 0;

  res.json({
    success: true,
    data: {
      totalUsers,
      activeTravelers,
      activeRequests,
      completedDeliveries,
      totalGMV: gmv,
      platformRevenue: revenue,
      completionRate: totalDeliveries ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0,
      cancellationRate: totalDeliveries ? Math.round((cancelledDeliveries / totalDeliveries) * 100) : 0,
      averageRating: ratingAgg[0]?.avgRating ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 0,
      totalTransactions: allTx,
    },
  });
});

export const listUsers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);
  res.json({ success: true, data: users, pagination: { page, limit, total } });
});

export const suspendUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');
  user.isSuspended = req.body.suspended !== false;
  await user.save();
  res.json({ success: true, data: user });
});

export const listAllTrips = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const trips = await Trip.find().populate('travelerId', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: trips });
});

export const listAllRequests = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const requests = await DeliveryRequest.find().populate('requesterId', 'name email').sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: requests });
});

export const listAllTransactions = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: transactions });
});

export const listVerificationRequests = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const verifications = await Verification.find({ status: VerificationStatus.PENDING }).populate('userId', 'name email').sort({ submittedAt: -1 });
  res.json({ success: true, data: verifications });
});

export const reviewVerification = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const verification = await Verification.findById(req.params.id);
  if (!verification) throw AppError.notFound('Verification submission not found');
  const { approve, note } = req.body as { approve: boolean; note?: string };

  verification.status = approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
  verification.reviewerNote = note;
  verification.reviewedAt = new Date();
  await verification.save();

  await User.findByIdAndUpdate(verification.userId, { verificationStatus: verification.status });
  res.json({ success: true, data: verification });
});

export const listReports = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const reports = await Report.find().populate('reporterId', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
});

export const resolveReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw AppError.notFound('Report not found');
  report.status = req.body.status || 'RESOLVED';
  await report.save();
  res.json({ success: true, data: report });
});

export const getPlatformSettings = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { platformFeePercent: env.DEFAULT_PLATFORM_FEE_PERCENT } },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: settings });
});

export const updatePlatformSettings = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { platformFeePercent, prohibitedCategories } = req.body;
  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { ...(platformFeePercent !== undefined ? { platformFeePercent } : {}), ...(prohibitedCategories ? { prohibitedCategories } : {}) },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: settings });
});
