import { z } from 'zod';
import { TransportType } from '../utils/constants';

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional(),
});

const baseTripSchema = z.object({
  origin: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  originCoordinates: coordinatesSchema,
  destinationCoordinates: coordinatesSchema,
  departureDateTime: z.coerce.date(),
  estimatedArrival: z.coerce.date(),
  capacityKg: z.number().positive().max(100),
  transportType: z.nativeEnum(TransportType),
  description: z.string().max(500).optional(),
});

export const createTripSchema = baseTripSchema
  .refine((d) => d.origin.trim().toLowerCase() !== d.destination.trim().toLowerCase(), {
    message: 'Origin and destination must be different',
    path: ['destination'],
  })
  .refine((d) => d.estimatedArrival.getTime() > d.departureDateTime.getTime(), {
    message: 'Estimated arrival must be after departure',
    path: ['estimatedArrival'],
  })
  .refine((d) => d.departureDateTime.getTime() > Date.now() - 1000 * 60 * 60, {
    message: 'Departure must not be in the past',
    path: ['departureDateTime'],
  });

export const updateTripSchema = baseTripSchema.partial();

const baseRequestSchema = z.object({
  pickup: z.string().min(2).max(120),
  destination: z.string().min(2).max(120),
  pickupCoordinates: coordinatesSchema,
  destinationCoordinates: coordinatesSchema,
  itemName: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  weightKg: z.number().positive().max(30),
  itemValue: z.number().min(0).max(500000),
  reward: z.number().min(1).max(100000),
  deliveryDeadline: z.coerce.date(),
});

export const createRequestSchema = baseRequestSchema
  .refine((d) => d.pickup.trim().toLowerCase() !== d.destination.trim().toLowerCase(), {
    message: 'Pickup and destination must be different',
    path: ['destination'],
  })
  .refine((d) => d.deliveryDeadline.getTime() > Date.now(), {
    message: 'Delivery deadline must be in the future',
    path: ['deliveryDeadline'],
  });

export const updateRequestSchema = baseRequestSchema.partial();

export const acceptRequestSchema = z.object({
  tripId: z.string().min(1),
});

export const createOrderSchema = z.object({
  deliveryRequestId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  deliveryRequestId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const otpVerifySchema = z.object({
  code: z.string().length(6),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const createRatingSchema = z.object({
  deliveryRequestId: z.string().min(1),
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const createVerificationSchema = z.object({
  verificationType: z.enum(['ID_PROOF', 'ADDRESS_PROOF', 'SELFIE']),
  documentType: z.string().min(2).max(60),
  documentUrl: z.string().url(),
});

export const createReportSchema = z.object({
  reportedUserId: z.string().optional(),
  deliveryRequestId: z.string().optional(),
  reason: z.string().min(3).max(200),
  details: z.string().max(2000).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.string().optional(),
});
