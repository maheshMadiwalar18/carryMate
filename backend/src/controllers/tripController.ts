import { Response } from 'express';
import { Trip } from '../models/Trip';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { TripStatus } from '../utils/constants';

function toGeoPoint(coords: { lat: number; lng: number }) {
  return { type: 'Point' as const, coordinates: [coords.lng, coords.lat] as [number, number] };
}

export const createTrip = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const b = req.body;
  const trip = await Trip.create({
    travelerId: req.user!._id,
    origin: b.origin,
    destination: b.destination,
    originLocation: toGeoPoint(b.originCoordinates),
    destinationLocation: toGeoPoint(b.destinationCoordinates),
    departureDateTime: b.departureDateTime,
    estimatedArrival: b.estimatedArrival,
    capacityKg: b.capacityKg,
    availableCapacityKg: b.capacityKg,
    transportType: b.transportType,
    description: b.description,
  });
  res.status(201).json({ success: true, data: trip });
});

export const listTrips = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { page, limit } = (req as any).validatedQuery;
  const filter: Record<string, unknown> = { status: TripStatus.ACTIVE };
  if (req.query.travelerId) filter.travelerId = req.query.travelerId;
  if (req.query.origin) filter.origin = new RegExp(String(req.query.origin), 'i');
  if (req.query.destination) filter.destination = new RegExp(String(req.query.destination), 'i');

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate('travelerId', 'name profileImage rating verificationStatus trustScore')
      .sort({ departureDateTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Trip.countDocuments(filter),
  ]);

  res.json({ success: true, data: trips, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getTrip = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id).populate('travelerId', 'name profileImage rating verificationStatus trustScore');
  if (!trip) throw AppError.notFound('Trip not found');
  res.json({ success: true, data: trip });
});

export const updateTrip = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw AppError.notFound('Trip not found');
  if (!trip.travelerId.equals(req.user!._id)) throw AppError.forbidden('You can only edit your own trips');
  if (trip.status !== TripStatus.ACTIVE) throw AppError.conflict('Only active trips can be edited');

  const b = req.body;
  if (b.origin) trip.origin = b.origin;
  if (b.destination) trip.destination = b.destination;
  if (b.originCoordinates) trip.originLocation = toGeoPoint(b.originCoordinates);
  if (b.destinationCoordinates) trip.destinationLocation = toGeoPoint(b.destinationCoordinates);
  if (b.departureDateTime) trip.departureDateTime = b.departureDateTime;
  if (b.estimatedArrival) trip.estimatedArrival = b.estimatedArrival;
  if (b.transportType) trip.transportType = b.transportType;
  if (typeof b.description === 'string') trip.description = b.description;
  if (typeof b.capacityKg === 'number') {
    const used = trip.capacityKg - trip.availableCapacityKg;
    if (b.capacityKg < used) throw AppError.validation('New capacity is less than already-committed capacity');
    trip.capacityKg = b.capacityKg;
    trip.availableCapacityKg = b.capacityKg - used;
  }

  await trip.save();
  res.json({ success: true, data: trip });
});

export const deleteTrip = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) throw AppError.notFound('Trip not found');
  if (!trip.travelerId.equals(req.user!._id)) throw AppError.forbidden('You can only cancel your own trips');
  if (trip.status === TripStatus.COMPLETED) throw AppError.conflict('Completed trips cannot be cancelled');

  trip.status = TripStatus.CANCELLED;
  await trip.save();
  res.json({ success: true, data: trip });
});
