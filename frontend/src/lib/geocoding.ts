import { config, isMapsConfigured } from './config';

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
}

// Small static gazetteer used when no Maps provider is configured, so
// location search still works end-to-end in demo mode. Covers the cities
// used throughout the seeded demo data plus other major Indian cities.
const DEMO_PLACES: PlaceResult[] = [
  { name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hubli, Karnataka', lat: 15.3647, lng: 75.124 },
  { name: 'Dharwad, Karnataka', lat: 15.4589, lng: 74.9997 },
  { name: 'Mysore, Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangalore, Karnataka', lat: 12.9141, lng: 74.856 },
  { name: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Goa', lat: 15.2993, lng: 74.124 },
  { name: 'Belgaum, Karnataka', lat: 15.8497, lng: 74.4977 },
  { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558 },
];

interface MapboxFeature {
  place_name: string;
  center: [number, number];
}

async function searchMapbox(query: string): Promise<PlaceResult[]> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${config.mapbox.token}&country=IN&types=place&limit=6`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Mapbox geocoding request failed');
  const data: { features?: MapboxFeature[] } = await res.json();
  return (data.features || []).map((f) => ({
    name: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

interface GoogleGeocodeResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}

async function searchGoogle(query: string): Promise<PlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:IN&key=${config.googleMaps.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Google geocoding request failed');
  const data: { results?: GoogleGeocodeResult[] } = await res.json();
  return (data.results || []).map((r) => ({
    name: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
  }));
}

function searchDemo(query: string): PlaceResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEMO_PLACES.slice(0, 6);
  return DEMO_PLACES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
}

/**
 * Searches for places by name. Uses the configured real Maps provider when
 * available (Mapbox preferred, then Google), otherwise falls back to a
 * static demo gazetteer so location search still works without API keys.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    if (config.mapbox.token) return await searchMapbox(query);
    if (config.googleMaps.apiKey) return await searchGoogle(query);
  } catch {
    // Fall through to demo data if the live provider errors out.
  }
  return searchDemo(query);
}

export { isMapsConfigured };
