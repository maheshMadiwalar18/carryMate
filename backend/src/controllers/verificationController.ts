import { Response } from 'express';
import { Verification } from '../models/Verification';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { VerificationStatus } from '../utils/constants';

export const submitVerification = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { verificationType, documentType, documentUrl } = req.body;
  const verification = await Verification.create({
    userId: req.user!._id,
    verificationType,
    documentType,
    documentUrl,
    status: VerificationStatus.PENDING,
  });
  await User.findByIdAndUpdate(req.user!._id, { verificationStatus: VerificationStatus.PENDING });
  res.status(201).json({ success: true, data: verification });
});

export const getMyVerificationStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const submissions = await Verification.find({ userId: req.user!._id }).sort({ submittedAt: -1 });
  res.json({ success: true, data: { status: req.user!.verificationStatus, submissions } });
});
