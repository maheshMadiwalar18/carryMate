import { ITrip } from '../models/Trip';
import { IDeliveryRequest } from '../models/DeliveryRequest';
import { IUser } from '../models/User';
import { routeCompatibilityScore } from '../utils/geo';

export interface MatchBreakdown {
  routeScore: number;
  dateScore: number;
  capacityScore: number;
  proximityScore: number;
  reputationScore: number;
  matchScore: number;
  explanation: string[];
}

const WEIGHTS = {
  route: 0.4,
  date: 0.25,
  capacity: 0.15,
  proximity: 0.1,
  reputation: 0.1,
};

/**
 * Computes a 0-100 compatibility score between a traveler's trip and a
 * requester's delivery request, using geospatial route matching rather than
 * exact string comparison (so "Bangalore -> Dharwad" reasonably matches a
 * "Bangalore -> Hubli" request when the cities are close along the corridor).
 */
export function computeMatch(trip: ITrip, request: IDeliveryRequest, traveler: IUser): MatchBreakdown {
  const explanation: string[] = [];

  // 1. Route compatibility (40%)
  const tripOrigin = { lng: trip.originLocation.coordinates[0], lat: trip.originLocation.coordinates[1] };
  const tripDest = { lng: trip.destinationLocation.coordinates[0], lat: trip.destinationLocation.coordinates[1] };
  const reqPickup = { lng: request.pickupLocation.coordinates[0], lat: request.pickupLocation.coordinates[1] };
  const reqDest = { lng: request.destinationLocation.coordinates[0], lat: request.destinationLocation.coordinates[1] };

  const routeScore = routeCompatibilityScore(tripOrigin, tripDest, reqPickup, reqDest);
  if (routeScore >= 90) explanation.push('Same route');
  else if (routeScore >= 60) explanation.push('Route passes close to your pickup and drop');

  // 2. Date/time compatibility (25%) — trip departure must fall on/before deadline,
  //    with a decaying score the further out the departure is from "now" relative
  //    to the deadline window.
  const now = Date.now();
  const departure = trip.departureDateTime.getTime();
  const deadline = request.deliveryDeadline.getTime();
  let dateScore = 0;
  if (departure <= deadline && departure >= now - 1000 * 60 * 60) {
    const windowMs = Math.max(deadline - now, 1);
    const positionInWindow = (departure - now) / windowMs; // 0 = now, 1 = at deadline
    dateScore = Math.round(100 - Math.max(0, Math.min(1, positionInWindow)) * 40); // 60-100
    explanation.push('Compatible date');
  } else if (departure > deadline) {
    dateScore = 0;
  } else {
    dateScore = 0;
  }

  // 3. Capacity compatibility (15%)
  let capacityScore = 0;
  if (trip.availableCapacityKg >= request.weightKg) {
    const slack = trip.availableCapacityKg - request.weightKg;
    capacityScore = slack <= request.weightKg ? 100 : 90; // slight preference for tighter, not wasteful, matches
    explanation.push('Enough capacity');
  }

  // 4. Pickup proximity (10%) — distance from trip origin to request pickup specifically
  const pickupProximityScore = routeCompatibilityScore(tripOrigin, tripOrigin, reqPickup, reqPickup, 40);
  if (pickupProximityScore >= 70) explanation.push('Pickup nearby');

  // 5. Traveler reputation (10%)
  const ratingComponent = (traveler.rating / 5) * 70; // up to 70
  const experienceComponent = Math.min(traveler.completedDeliveries, 30); // up to 30
  const reputationScore = Math.round(Math.min(100, ratingComponent + experienceComponent));
  if (traveler.rating >= 4.5) explanation.push('Highly rated traveler');

  const matchScore = Math.round(
    routeScore * WEIGHTS.route +
      dateScore * WEIGHTS.date +
      capacityScore * WEIGHTS.capacity +
      pickupProximityScore * WEIGHTS.proximity +
      reputationScore * WEIGHTS.reputation
  );

  return {
    routeScore,
    dateScore,
    capacityScore,
    proximityScore: pickupProximityScore,
    reputationScore,
    matchScore,
    explanation,
  };
}

/** Minimum score for a pair to be surfaced as a match at all. */
export const MIN_MATCH_SCORE = 35;
