import { Response } from 'express';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { RequestStatus } from '../utils/constants';
import { assertItemAllowed } from '../services/itemSafetyService';
import { getPlatformFeePercent } from './adminController';

function toGeoPoint(coords: { lat: number; lng: number }) {
  return { type: 'Point' as const, coordinates: [coords.lng, coords.lat] as [number, number] };
}

export const createRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const b = req.body;
  assertItemAllowed(b.itemName, b.description);

  const request = await DeliveryRequest.create({
    requesterId: req.user!._id,
    pickup: b.pickup,
    destination: b.destination,
    pickupLocation: toGeoPoint(b.pickupCoordinates),
    destinationLocation: toGeoPoint(b.destinationCoordinates),
    itemName: b.itemName,
    description: b.description,
    imageUrl: b.imageUrl,
    weightKg: b.weightKg,
    itemValue: b.itemValue,
    reward: b.reward,
    deliveryDeadline: b.deliveryDeadline,
  });

  const feePercent = await getPlatformFeePercent();
  res.status(201).json({
    success: true,
    data: request,
    feeBreakdown: {
      reward: request.reward,
      platformFeePercent: feePercent,
      platformFee: Math.round(request.reward * (feePercent / 100)),
      total: Math.round(request.reward * (1 + feePercent / 100)),
    },
  });
});

export const listRequests = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = (req as any).validatedQuery;
  const filter: Record<string, unknown> = { status: RequestStatus.OPEN };
  if (req.query.requesterId) filter.requesterId = req.query.requesterId;
  if (req.query.pickup) filter.pickup = new RegExp(String(req.query.pickup), 'i');
  if (req.query.destination) filter.destination = new RegExp(String(req.query.destination), 'i');
  if (req.query.minReward) filter.reward = { $gte: Number(req.query.minReward) };

  const [requests, total] = await Promise.all([
    DeliveryRequest.find(filter)
      .populate('requesterId', 'name profileImage rating verificationStatus')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    DeliveryRequest.countDocuments(filter),
  ]);

  res.json({ success: true, data: requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await DeliveryRequest.findById(req.params.id).populate('requesterId', 'name profileImage rating verificationStatus');
  if (!request) throw AppError.notFound('Delivery request not found');
  res.json({ success: true, data: request });
});

export const updateRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await DeliveryRequest.findById(req.params.id);
  if (!request) throw AppError.notFound('Delivery request not found');
  if (!request.requesterId.equals(req.user!._id)) throw AppError.forbidden('You can only edit your own requests');
  if (request.status !== RequestStatus.OPEN) throw AppError.conflict('Requests can only be edited before a traveler is accepted');

  const b = req.body;
  if (b.itemName || b.description) assertItemAllowed(b.itemName || request.itemName, b.description ?? request.description);

  if (b.pickup) request.pickup = b.pickup;
  if (b.destination) request.destination = b.destination;
  if (b.pickupCoordinates) request.pickupLocation = toGeoPoint(b.pickupCoordinates);
  if (b.destinationCoordinates) request.destinationLocation = toGeoPoint(b.destinationCoordinates);
  if (b.itemName) request.itemName = b.itemName;
  if (typeof b.description === 'string') request.description = b.description;
  if (b.imageUrl) request.imageUrl = b.imageUrl;
  if (typeof b.weightKg === 'number') request.weightKg = b.weightKg;
  if (typeof b.itemValue === 'number') request.itemValue = b.itemValue;
  if (typeof b.reward === 'number') request.reward = b.reward;
  if (b.deliveryDeadline) request.deliveryDeadline = b.deliveryDeadline;

  await request.save();
  res.json({ success: true, data: request });
});

export const deleteRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await DeliveryRequest.findById(req.params.id);
  if (!request) throw AppError.notFound('Delivery request not found');
  if (!request.requesterId.equals(req.user!._id)) throw AppError.forbidden('You can only cancel your own requests');
  if ([RequestStatus.COMPLETED].includes(request.status)) throw AppError.conflict('Completed requests cannot be cancelled');

  request.status = RequestStatus.CANCELLED;
  await request.save();
  res.json({ success: true, data: request });
});
