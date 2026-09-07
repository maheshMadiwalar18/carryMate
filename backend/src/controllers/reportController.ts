import { Response } from 'express';
import { Report } from '../models/Report';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';

export const createReport = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const report = await Report.create({ ...req.body, reporterId: req.user!._id });
  res.status(201).json({ success: true, data: report });
});

export const createDispute = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const report = await Report.create({ ...req.body, reporterId: req.user!._id, reason: `DISPUTE: ${req.body.reason}` });
  res.status(201).json({ success: true, data: report });
});
