import { Response } from 'express';
import { Delivery } from '../models/Delivery';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { DeliveryState, TransactionStatus } from '../utils/constants';
import { assertTransition } from '../services/deliveryStateMachine';
import { createOrder, verifyPaymentSignature, computeDemoSignature } from '../services/paymentService';
import { getPlatformFeePercent } from './adminController';
import { moveToPickupPendingAndGenerateOtp } from './deliveryController';
import { notify } from '../services/notificationService';

export const createPaymentOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { deliveryRequestId } = req.body as { deliveryRequestId: string };

  const request = await DeliveryRequest.findById(deliveryRequestId);
  if (!request) throw AppError.notFound('Delivery request not found');
  if (!request.requesterId.equals(req.user!._id)) throw AppError.forbidden('Only the requester can pay for this delivery');

  const delivery = await Delivery.findOne({ deliveryRequestId: request._id });
  if (!delivery) throw AppError.notFound('No accepted delivery found for this request');
  if (delivery.state !== DeliveryState.PAYMENT_PENDING) {
    throw AppError.conflict('This delivery is not awaiting payment', 'NOT_AWAITING_PAYMENT');
  }

  const existingPaid = await Transaction.findOne({ deliveryRequestId: request._id, status: { $in: [TransactionStatus.PAID, TransactionStatus.SETTLED] } });
  if (existingPaid) throw AppError.conflict('This delivery has already been paid for', 'DUPLICATE_PAYMENT');

  const feePercent = await getPlatformFeePercent();
  const platformFee = Math.round(request.reward * (feePercent / 100));
  const totalAmount = request.reward + platformFee;

  const order = await createOrder(totalAmount, `req_${request._id}`);

  await Transaction.findOneAndUpdate(
    { deliveryRequestId: request._id },
    {
      deliveryRequestId: request._id,
      requesterId: request.requesterId,
      travelerId: delivery.travelerId,
      amount: totalAmount,
      platformFee,
      travelerAmount: request.reward,
      razorpayOrderId: order.orderId,
      status: TransactionStatus.CREATED,
      isDemo: order.isDemo,
    },
    { upsert: true }
  );

  res.status(201).json({
    success: true,
    data: {
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      isDemo: order.isDemo,
      keyId: order.keyId,
      // Demo-mode convenience: the frontend can compute/skip the real Checkout
      // widget and call verify directly using this deterministic signature.
      ...(order.isDemo ? { demoSignatureHint: 'Call POST /api/payments/verify with any paymentId; the demo signature is derived server-side.' } : {}),
    },
  });
});

export const verifyPayment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { deliveryRequestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
    deliveryRequestId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };

  const request = await DeliveryRequest.findById(deliveryRequestId);
  if (!request) throw AppError.notFound('Delivery request not found');
  if (!request.requesterId.equals(req.user!._id)) throw AppError.forbidden('Only the requester can verify this payment');

  const transaction = await Transaction.findOne({ deliveryRequestId: request._id, razorpayOrderId });
  if (!transaction) throw AppError.notFound('No matching payment order found');
  if (transaction.status === TransactionStatus.PAID || transaction.status === TransactionStatus.SETTLED) {
    throw AppError.conflict('This payment has already been verified', 'DUPLICATE_PAYMENT');
  }

  const signatureIsValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!signatureIsValid) throw AppError.unauthorized('Payment signature verification failed', 'PAYMENT_SIGNATURE_INVALID');

  transaction.razorpayPaymentId = razorpayPaymentId;
  transaction.status = TransactionStatus.PAID;
  await transaction.save();

  const delivery = await Delivery.findOne({ deliveryRequestId: request._id });
  if (!delivery) throw AppError.notFound('Delivery not found');
  assertTransition(delivery.state, DeliveryState.PAYMENT_CONFIRMED);
  delivery.state = DeliveryState.PAYMENT_CONFIRMED;
  delivery.stateHistory.push({ state: DeliveryState.PAYMENT_CONFIRMED, at: new Date() });
  await delivery.save();

  await notify(delivery.travelerId, 'PAYMENT_SUCCESSFUL', 'Payment received', 'The requester has paid. You can now arrange pickup.', delivery._id);

  const otp = await moveToPickupPendingAndGenerateOtp(delivery);

  res.json({
    success: true,
    data: { delivery, transaction },
    // Pickup OTP is returned to the requester only, since they hand it to the traveler in person.
    pickupOtp: { code: otp.code, expiresAt: otp.expiresAt },
  });
});

/** Demo-mode helper: computes a valid signature for a demo order so the frontend can drive the flow without a real Razorpay checkout. */
export const getDemoSignature = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { orderId, paymentId } = req.query as { orderId: string; paymentId: string };
  if (!orderId || !paymentId) throw AppError.validation('orderId and paymentId are required');
  res.json({ success: true, data: { signature: computeDemoSignature(orderId, paymentId) } });
});

export const getMyTransactions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const transactions = await Transaction.find({ $or: [{ requesterId: req.user!._id }, { travelerId: req.user!._id }] }).sort({ createdAt: -1 });
  res.json({ success: true, data: transactions });
});
