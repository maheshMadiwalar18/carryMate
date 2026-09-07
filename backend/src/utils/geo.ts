export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates, in kilometers. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns both the distance from point p to the segment a->b, and the
 * projection parameter t (0 = at point a, 1 = at point b, clamped to [0,1])
 * so callers can reason about *where along the route* p falls.
 */
export function projectOntoSegmentKm(p: Coordinates, a: Coordinates, b: Coordinates): { distanceKm: number; t: number } {
  const toXY = (c: Coordinates) => ({
    x: c.lng * 111.32 * Math.cos(toRad((a.lat + b.lat) / 2)),
    y: c.lat * 110.57,
  });
  const P = toXY(p);
  const A = toXY(a);
  const B = toXY(b);

  const ABx = B.x - A.x;
  const ABy = B.y - A.y;
  const lengthSq = ABx * ABx + ABy * ABy;

  const rawT = lengthSq === 0 ? 0 : ((P.x - A.x) * ABx + (P.y - A.y) * ABy) / lengthSq;
  const t = Math.max(0, Math.min(1, rawT));

  const closest = { x: A.x + t * ABx, y: A.y + t * ABy };
  const dx = P.x - closest.x;
  const dy = P.y - closest.y;
  return { distanceKm: Math.sqrt(dx * dx + dy * dy), t: rawT };
}

export function distancePointToSegmentKm(p: Coordinates, a: Coordinates, b: Coordinates): number {
  return projectOntoSegmentKm(p, a, b).distanceKm;
}

/**
 * Route similarity score (0-100) between a traveler's origin->destination route
 * and a requester's pickup->destination route, using geospatial proximity rather
 * than exact string matching. Allows "close enough" cities along the same route
 * (e.g. Dharwad vs Hubli), while penalizing routes that run in the *opposite*
 * direction even if they happen to share an endpoint (e.g. a Mysore->Bangalore
 * request should not match well against a Bangalore->Hubli trip just because
 * both touch Bangalore).
 */
export function routeCompatibilityScore(
  travelerOrigin: Coordinates,
  travelerDestination: Coordinates,
  requestPickup: Coordinates,
  requestDestination: Coordinates,
  proximityToleranceKm = 60
): number {
  const originGap = haversineDistanceKm(travelerOrigin, requestPickup);
  const destGap = haversineDistanceKm(travelerDestination, requestDestination);

  const pickupProj = projectOntoSegmentKm(requestPickup, travelerOrigin, travelerDestination);
  const destProj = projectOntoSegmentKm(requestDestination, travelerOrigin, travelerDestination);

  const originComponent = scoreFromDistance(Math.min(originGap, pickupProj.distanceKm), proximityToleranceKm);
  const destComponent = scoreFromDistance(Math.min(destGap, destProj.distanceKm), proximityToleranceKm);

  // Directionality guard: the pickup should fall at/near the origin end of the
  // trip (small t) and the destination near the far end (larger t). If the
  // destination actually projects *earlier* along the route than the pickup,
  // the request runs opposite to the trip's direction — penalize heavily
  // regardless of how close either endpoint happens to be.
  const directionGap = destProj.t - pickupProj.t;
  if (directionGap < -0.05) {
    const reversalPenalty = Math.min(1, Math.abs(directionGap)); // 0..1
    return Math.round(((originComponent + destComponent) / 2) * (1 - reversalPenalty) * 0.5);
  }

  return Math.round((originComponent + destComponent) / 2);
}

function scoreFromDistance(distanceKm: number, toleranceKm: number): number {
  if (distanceKm <= 5) return 100;
  if (distanceKm >= toleranceKm * 3) return 0;
  // Linear decay from 100 at 5km to 0 at 3x tolerance
  const score = 100 - ((distanceKm - 5) / (toleranceKm * 3 - 5)) * 100;
  return Math.max(0, Math.min(100, score));
}
