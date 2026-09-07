import { Response } from 'express';
import { Trip } from '../models/Trip';
import { DeliveryRequest } from '../models/DeliveryRequest';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import { computeMatch, MIN_MATCH_SCORE } from '../services/matchingService';
import { RequestStatus, TripStatus } from '../utils/constants';

/** Requester's view: candidate travelers/trips for a given delivery request. */
export const getMatchesForRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await DeliveryRequest.findById(req.params.requestId);
  if (!request) throw AppError.notFound('Delivery request not found');

  const candidateTrips = await Trip.find({
    status: TripStatus.ACTIVE,
    availableCapacityKg: { $gte: request.weightKg },
    departureDateTime: { $lte: request.deliveryDeadline },
  }).populate('travelerId');

  const scored = [];
  for (const trip of candidateTrips) {
    const traveler = trip.travelerId as any;
    if (!traveler || traveler._id.equals(request.requesterId)) continue;
    const breakdown = computeMatch(trip, request, traveler);
    if (breakdown.matchScore < MIN_MATCH_SCORE) continue;

    const match = await Match.findOneAndUpdate(
      { tripId: trip._id, requestId: request._id },
      {
        tripId: trip._id,
        requestId: request._id,
        travelerId: traveler._id,
        requesterId: request.requesterId,
        matchScore: breakdown.matchScore,
        routeScore: breakdown.routeScore,
        dateScore: breakdown.dateScore,
        capacityScore: breakdown.capacityScore,
        proximityScore: breakdown.proximityScore,
        reputationScore: breakdown.reputationScore,
      },
      { upsert: true, new: true }
    );

    scored.push({ match, trip, traveler, explanation: breakdown.explanation });
  }

  scored.sort((a, b) => b.match.matchScore - a.match.matchScore);
  res.json({ success: true, data: scored });
});

/** Traveler's view: candidate delivery requests for a given trip. */
export const getMatchesForTrip = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const trip = await Trip.findById(req.params.tripId).populate('travelerId');
  if (!trip) throw AppError.notFound('Trip not found');
  const traveler = trip.travelerId as any;

  const candidateRequests = await DeliveryRequest.find({
    status: RequestStatus.OPEN,
    weightKg: { $lte: trip.availableCapacityKg },
    deliveryDeadline: { $gte: trip.departureDateTime },
  });

  const scored = [];
  for (const request of candidateRequests) {
    if (request.requesterId.equals(traveler._id)) continue;
    const breakdown = computeMatch(trip, request, traveler);
    if (breakdown.matchScore < MIN_MATCH_SCORE) continue;

    const match = await Match.findOneAndUpdate(
      { tripId: trip._id, requestId: request._id },
      {
        tripId: trip._id,
        requestId: request._id,
        travelerId: traveler._id,
        requesterId: request.requesterId,
        matchScore: breakdown.matchScore,
        routeScore: breakdown.routeScore,
        dateScore: breakdown.dateScore,
        capacityScore: breakdown.capacityScore,
        proximityScore: breakdown.proximityScore,
        reputationScore: breakdown.reputationScore,
      },
      { upsert: true, new: true }
    );

    scored.push({ match, request, explanation: breakdown.explanation });
  }

  scored.sort((a, b) => b.match.matchScore - a.match.matchScore);
  res.json({ success: true, data: scored });
});
