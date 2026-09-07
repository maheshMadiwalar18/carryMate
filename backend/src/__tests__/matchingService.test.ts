import { computeMatch, MIN_MATCH_SCORE } from '../services/matchingService';

const BANGALORE: [number, number] = [77.5946, 12.9716]; // [lng, lat]
const HUBLI: [number, number] = [75.124, 15.3647];
const DHARWAD: [number, number] = [74.9997, 15.4589];

function makeTrip(overrides: Partial<any> = {}) {
  return {
    originLocation: { coordinates: BANGALORE },
    destinationLocation: { coordinates: HUBLI },
    departureDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    availableCapacityKg: 5,
    ...overrides,
  } as any;
}

function makeRequest(overrides: Partial<any> = {}) {
  return {
    pickupLocation: { coordinates: BANGALORE },
    destinationLocation: { coordinates: HUBLI },
    weightKg: 1,
    deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  } as any;
}

function makeTraveler(overrides: Partial<any> = {}) {
  return { rating: 4.9, completedDeliveries: 23, ...overrides } as any;
}

describe('computeMatch — the core CarryMate scenario', () => {
  it('produces a high match score for an identical route, compatible dates, sufficient capacity, and a highly-rated traveler', () => {
    const result = computeMatch(makeTrip(), makeRequest(), makeTraveler());

    expect(result.routeScore).toBe(100);
    expect(result.capacityScore).toBeGreaterThan(0);
    expect(result.dateScore).toBeGreaterThan(0);
    expect(result.reputationScore).toBeGreaterThan(80);
    expect(result.matchScore).toBeGreaterThanOrEqual(85);
    expect(result.explanation).toContain('Same route');
    expect(result.explanation).toContain('Enough capacity');
    expect(result.explanation).toContain('Highly rated traveler');
  });

  it('recognizes a geographically close but non-identical route (Dharwad vs Hubli) as a viable match', () => {
    const trip = makeTrip({ destinationLocation: { coordinates: DHARWAD } });
    const result = computeMatch(trip, makeRequest(), makeTraveler());
    expect(result.matchScore).toBeGreaterThanOrEqual(MIN_MATCH_SCORE);
    expect(result.routeScore).toBeGreaterThan(60);
  });

  it('scores zero capacity compatibility when the item is heavier than available capacity', () => {
    const trip = makeTrip({ availableCapacityKg: 0.5 });
    const result = computeMatch(trip, makeRequest({ weightKg: 2 }), makeTraveler());
    expect(result.capacityScore).toBe(0);
  });

  it('scores zero date compatibility when departure is after the delivery deadline', () => {
    const trip = makeTrip({ departureDateTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) });
    const request = makeRequest({ deliveryDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) });
    const result = computeMatch(trip, request, makeTraveler());
    expect(result.dateScore).toBe(0);
  });

  it('gives a lower reputation score to a new traveler with no history', () => {
    const result = computeMatch(makeTrip(), makeRequest(), makeTraveler({ rating: 0, completedDeliveries: 0 }));
    expect(result.reputationScore).toBe(0);
  });

  it('always returns a matchScore between 0 and 100', () => {
    const result = computeMatch(makeTrip(), makeRequest(), makeTraveler());
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });
});
