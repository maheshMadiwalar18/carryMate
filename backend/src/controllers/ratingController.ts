import { Response } from 'express';
import { Rating } from '../models/Rating';
import { Delivery } from '../models/Delivery';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { DeliveryState } from '../utils/constants';
import { applyRating } from '../services/trustService';
import { notify } from '../services/notificationService';

export const createRating = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { deliveryRequestId, revieweeId, rating, comment } = req.body;

  const delivery = await Delivery.findOne({ deliveryRequestId });
  if (!delivery) throw AppError.notFound('Delivery not found for this request');
  if (delivery.state !== DeliveryState.COMPLETED) {
    throw AppError.conflict('Ratings can only be submitted after a delivery is completed');
  }

  const reviewerId = req.user!._id.toString();
  const isTraveler = delivery.travelerId.equals(reviewerId);
  const isRequester = delivery.requesterId.equals(reviewerId);
  if (!isTraveler && !isRequester) throw AppError.forbidden('You were not a participant in this delivery');

  const expectedReviewee = isTraveler ? delivery.requesterId : delivery.travelerId;
  if (expectedReviewee.toString() !== revieweeId) throw AppError.validation('revieweeId does not match the other participant in this delivery');

  try {
    const created = await Rating.create({ deliveryRequestId, reviewerId, revieweeId, rating, comment });
    await applyRating(revieweeId, rating);
    await notify(revieweeId, 'RATING_RECEIVED', 'You received a new rating', `${rating}/5 stars`, created._id);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    if (err?.code === 11000) throw AppError.conflict('You have already rated this delivery', 'DUPLICATE_RATING');
    throw err;
  }
});
