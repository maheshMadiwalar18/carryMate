import { haversineDistanceKm, routeCompatibilityScore } from '../utils/geo';

const BANGALORE = { lat: 12.9716, lng: 77.5946 };
const HUBLI = { lat: 15.3647, lng: 75.124 };
const DHARWAD = { lat: 15.4589, lng: 74.9997 }; // ~20km from Hubli
const MYSORE = { lat: 12.2958, lng: 76.6394 };

describe('haversineDistanceKm', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineDistanceKm(BANGALORE, BANGALORE)).toBeCloseTo(0, 3);
  });

  it('returns a realistic distance for Bangalore -> Hubli (~350km)', () => {
    const d = haversineDistanceKm(BANGALORE, HUBLI);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(420);
  });

  it('Hubli and Dharwad are close together (~20-25km)', () => {
    const d = haversineDistanceKm(HUBLI, DHARWAD);
    expect(d).toBeLessThan(30);
  });
});

describe('routeCompatibilityScore', () => {
  it('scores a perfectly identical route as 100', () => {
    const score = routeCompatibilityScore(BANGALORE, HUBLI, BANGALORE, HUBLI);
    expect(score).toBe(100);
  });

  it('scores a nearby-city route (Bangalore->Dharwad trip vs Bangalore->Hubli request) highly, without exact string match', () => {
    const score = routeCompatibilityScore(BANGALORE, DHARWAD, BANGALORE, HUBLI);
    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('scores a completely unrelated route low', () => {
    const score = routeCompatibilityScore(BANGALORE, HUBLI, MYSORE, BANGALORE);
    expect(score).toBeLessThan(40);
  });
});
