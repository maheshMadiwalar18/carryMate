import { Response } from 'express';
import { Types } from 'mongoose';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { Trip } from '../models/Trip';
import { Match } from '../models/Match';
import { Delivery } from '../models/Delivery';
import { Conversation } from '../models/Conversation';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { DeliveryState, RequestStatus, TripStatus, MatchStatus, OtpType } from '../utils/constants';
import { assertTransition } from '../services/deliveryStateMachine';
import { generateOtp, verifyOtp } from '../services/otpService';
import { notify } from '../services/notificationService';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { TransactionStatus } from '../utils/constants';

/** Requester selects a traveler's trip for their request. Creates the Delivery record in MATCHED state. */
export const selectTraveler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await DeliveryRequest.findById(req.params.requestId);
  if (!request) throw AppError.notFound('Delivery request not found');
  if (!request.requesterId.equals(req.user!._id)) throw AppError.forbidden('You can only act on your own request');
  if (request.status !== RequestStatus.OPEN) throw AppError.conflict('This request is no longer open for matching');

  const { tripId } = req.body as { tripId: string };
  const trip = await Trip.findById(tripId);
  if (!trip || trip.status !== TripStatus.ACTIVE) throw AppError.notFound('Trip not found or no longer active');
  if (trip.availableCapacityKg < request.weightKg) {
    throw new AppError('Traveler does not have enough available capacity', 409, 'INSUFFICIENT_CAPACITY');
  }

  const existing = await Delivery.findOne({ deliveryRequestId: request._id });
  if (existing) throw AppError.conflict('A traveler has already been selected for this request');

  const match = await Match.findOneAndUpdate(
    { tripId: trip._id, requestId: request._id },
    { status: MatchStatus.SELECTED },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const delivery = await Delivery.create({
    deliveryRequestId: request._id,
    tripId: trip._id,
    matchId: match._id,
    travelerId: trip.travelerId,
    requesterId: request.requesterId,
    state: DeliveryState.MATCHED,
    stateHistory: [{ state: DeliveryState.MATCHED, at: new Date() }],
  });

  request.status = RequestStatus.MATCHED;
  request.selectedTripId = trip._id;
  request.selectedTravelerId = trip.travelerId;
  await request.save();

  await notify(trip.travelerId, 'REQUESTER_SELECTED', 'You were selected for a delivery', `${request.itemName}: ${request.pickup} -> ${request.destination}`, delivery._id);

  res.status(201).json({ success: true, data: delivery });
});

function assertParticipant(delivery: any, userId: Types.ObjectId) {
  if (!delivery.travelerId.equals(userId) && !delivery.requesterId.equals(userId)) {
    throw AppError.forbidden('You are not a participant in this delivery');
  }
}

async function loadDelivery(id: string) {
  const delivery = await Delivery.findById(id);
  if (!delivery) throw AppError.notFound('Delivery not found');
  return delivery;
}

async function transition(delivery: any, next: DeliveryState, note?: string) {
  assertTransition(delivery.state, next);
  delivery.state = next;
  delivery.stateHistory.push({ state: next, at: new Date(), note });
  await delivery.save();
}

/** Traveler accepts a request the requester selected them for. */
export const acceptDelivery = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.travelerId.equals(req.user!._id)) throw AppError.forbidden('Only the selected traveler can accept this delivery');

  await transition(delivery, DeliveryState.TRAVELER_ACCEPTED);

  const trip = await Trip.findById(delivery.tripId);
  const request = await DeliveryRequest.findById(delivery.deliveryRequestId);
  if (!trip || !request) throw AppError.notFound('Related trip or request missing');

  if (trip.availableCapacityKg < request.weightKg) {
    throw new AppError('Traveler no longer has enough available capacity', 409, 'INSUFFICIENT_CAPACITY');
  }
  trip.availableCapacityKg -= request.weightKg;
  await trip.save();

  request.status = RequestStatus.ACCEPTED;
  await request.save();

  await Match.updateOne({ _id: delivery.matchId }, { status: MatchStatus.ACCEPTED });
  await notify(request.requesterId, 'TRAVELER_ACCEPTED', 'Your traveler accepted the delivery', `${trip.origin} -> ${trip.destination}`, delivery._id);

  await transition(delivery, DeliveryState.PAYMENT_PENDING);

  res.json({ success: true, data: delivery });
});

export const cancelDelivery = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  assertParticipant(delivery, req.user!._id);

  const cancellable: DeliveryState[] = [
    DeliveryState.REQUESTED,
    DeliveryState.MATCHED,
    DeliveryState.TRAVELER_ACCEPTED,
    DeliveryState.PAYMENT_PENDING,
    DeliveryState.PAYMENT_CONFIRMED,
    DeliveryState.PICKUP_PENDING,
  ];
  if (!cancellable.includes(delivery.state)) {
    throw AppError.conflict('This delivery can no longer be cancelled', 'NOT_CANCELLABLE');
  }

  // Capture the pre-cancellation state before transitioning, since capacity
  // was only ever committed to the trip once the traveler accepted.
  const capacityWasCommitted = [
    DeliveryState.TRAVELER_ACCEPTED,
    DeliveryState.PAYMENT_PENDING,
    DeliveryState.PAYMENT_CONFIRMED,
    DeliveryState.PICKUP_PENDING,
  ].includes(delivery.state);

  await transition(delivery, DeliveryState.CANCELLED, req.body?.reason);
  delivery.cancelledBy = req.user!._id;
  delivery.cancellationReason = req.body?.reason;
  await delivery.save();

  // Release any capacity that had been committed.
  const trip = await Trip.findById(delivery.tripId);
  const request = await DeliveryRequest.findById(delivery.deliveryRequestId);
  if (trip && request && capacityWasCommitted) {
    trip.availableCapacityKg += request.weightKg;
    await trip.save();
  }
  if (request) {
    request.status = RequestStatus.CANCELLED;
    await request.save();
  }

  const otherParty = delivery.travelerId.equals(req.user!._id) ? delivery.requesterId : delivery.travelerId;
  await notify(otherParty, 'CANCELLATION', 'Delivery cancelled', req.body?.reason || 'The delivery was cancelled.', delivery._id);

  res.json({ success: true, data: delivery });
});

/** Called internally once payment is confirmed (see paymentController) — generates the pickup OTP. */
export async function moveToPickupPendingAndGenerateOtp(delivery: any) {
  await transition(delivery, DeliveryState.PICKUP_PENDING);
  const otp = await generateOtp(delivery.deliveryRequestId, OtpType.PICKUP);

  const request = await DeliveryRequest.findById(delivery.deliveryRequestId);
  if (request) await Conversation.findOneAndUpdate(
    { deliveryRequestId: request._id },
    { $setOnInsert: { participants: [delivery.requesterId, delivery.travelerId], deliveryRequestId: request._id } },
    { upsert: true }
  );

  return otp;
}

/** Requester generates/re-generates the pickup OTP to hand to the traveler in person. */
export const generatePickupOtp = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.requesterId.equals(req.user!._id)) throw AppError.forbidden('Only the requester can generate the pickup OTP');
  if (delivery.state !== DeliveryState.PICKUP_PENDING) throw AppError.conflict('Delivery is not awaiting pickup');

  const otp = await generateOtp(delivery.deliveryRequestId, OtpType.PICKUP);
  res.json({ success: true, data: { code: otp.code, expiresAt: otp.expiresAt } });
});

/** Traveler verifies the pickup OTP shown to them by the requester. */
export const verifyPickupOtp = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.travelerId.equals(req.user!._id)) throw AppError.forbidden('Only the traveler can verify pickup');
  if (delivery.state !== DeliveryState.PICKUP_PENDING) throw AppError.conflict('Delivery is not awaiting pickup');

  await verifyOtp(delivery.deliveryRequestId, OtpType.PICKUP, req.body.code);

  delivery.pickupVerifiedAt = new Date();
  await transition(delivery, DeliveryState.ITEM_PICKED_UP);
  // Traveler is now carrying the item on their existing journey — moves straight to in-transit.
  await transition(delivery, DeliveryState.IN_TRANSIT);

  const request = await DeliveryRequest.findByIdAndUpdate(delivery.deliveryRequestId, { status: RequestStatus.IN_PROGRESS });
  await notify(delivery.requesterId, 'ITEM_PICKED_UP', 'Your item was picked up', 'Your item is now in transit.', delivery._id);

  res.json({ success: true, data: delivery });
});

/** Requester generates the delivery OTP once the traveler reports arrival, to hand over at drop-off. */
export const generateDeliveryOtp = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.requesterId.equals(req.user!._id)) throw AppError.forbidden('Only the requester can generate the delivery OTP');
  if (![DeliveryState.IN_TRANSIT, DeliveryState.DELIVERY_PENDING].includes(delivery.state as any)) {
    throw AppError.conflict('Delivery is not ready for drop-off yet');
  }

  if (delivery.state === DeliveryState.IN_TRANSIT) await transition(delivery, DeliveryState.DELIVERY_PENDING);

  const otp = await generateOtp(delivery.deliveryRequestId, OtpType.DELIVERY);
  await notify(delivery.travelerId, 'IN_TRANSIT', 'Requester is ready to receive the item', 'Ask the requester for the delivery code to confirm drop-off.', delivery._id);

  res.json({ success: true, data: { code: otp.code, expiresAt: otp.expiresAt } });
});

/** Traveler verifies the delivery OTP given to them by the requester at drop-off. */
export const verifyDeliveryOtp = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.travelerId.equals(req.user!._id)) throw AppError.forbidden('Only the traveler can verify delivery');
  if (delivery.state !== DeliveryState.DELIVERY_PENDING) throw AppError.conflict('Delivery is not pending drop-off confirmation');

  await verifyOtp(delivery.deliveryRequestId, OtpType.DELIVERY, req.body.code);

  delivery.deliveryVerifiedAt = new Date();
  await transition(delivery, DeliveryState.DELIVERED);

  await notify(delivery.requesterId, 'DELIVERY_COMPLETED', 'Your item was delivered', 'Please confirm receipt to release the traveler\'s earnings.', delivery._id);

  res.json({ success: true, data: delivery });
});

/** Requester confirms receipt — finalizes the delivery and marks payment for settlement. */
export const confirmDelivery = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await loadDelivery(req.params.id);
  if (!delivery.requesterId.equals(req.user!._id)) throw AppError.forbidden('Only the requester can confirm delivery');
  if (delivery.state !== DeliveryState.DELIVERED) throw AppError.conflict('Delivery has not been marked delivered yet');

  delivery.requesterConfirmedAt = new Date();
  await transition(delivery, DeliveryState.COMPLETED);

  await DeliveryRequest.findByIdAndUpdate(delivery.deliveryRequestId, { status: RequestStatus.COMPLETED });
  await User.findByIdAndUpdate(delivery.travelerId, { $inc: { completedDeliveries: 1 } });
  await Transaction.findOneAndUpdate({ deliveryRequestId: delivery.deliveryRequestId }, { status: TransactionStatus.SETTLED });

  await notify(delivery.travelerId, 'DELIVERY_COMPLETED', 'Delivery completed', 'The requester confirmed receipt. Your earnings have been recorded.', delivery._id);

  res.json({ success: true, data: delivery });
});

export const getDelivery = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate('travelerId', 'name profileImage rating verificationStatus')
    .populate('requesterId', 'name profileImage rating verificationStatus')
    .populate('tripId')
    .populate('deliveryRequestId');
  if (!delivery) throw AppError.notFound('Delivery not found');
  assertParticipant(delivery, req.user!._id);
  res.json({ success: true, data: delivery });
});

export const listMyDeliveries = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const deliveries = await Delivery.find({ $or: [{ travelerId: req.user!._id }, { requesterId: req.user!._id }] })
    .populate('tripId')
    .populate('deliveryRequestId')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: deliveries });
});
