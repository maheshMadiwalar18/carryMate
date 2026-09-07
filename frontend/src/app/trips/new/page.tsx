'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import type { PlaceResult } from '@/lib/geocoding';

export default function NewTripPage() {
  const { token, loading } = useRequireAuth();
  const router = useRouter();

  const [origin, setOrigin] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [departureDateTime, setDepartureDateTime] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [capacityKg, setCapacityKg] = useState('5');
  const [transportType, setTransportType] = useState('TRAIN');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!origin || !destination) {
      setError('Please select both an origin and a destination from the list.');
      return;
    }
    if (origin.name === destination.name) {
      setError('Origin and destination must be different.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ data: { _id: string } }>('/trips', {
        origin: origin.name,
        destination: destination.name,
        originCoordinates: { lat: origin.lat, lng: origin.lng },
        destinationCoordinates: { lat: destination.lat, lng: destination.lng },
        departureDateTime,
        estimatedArrival,
        capacityKg: Number(capacityKg),
        transportType,
        description: description || undefined,
      }, token);
      router.push(`/trips/${res.data._id}/matches`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Post a trip</h1>
      <p className="text-sm text-neutral-500 mb-6">Already heading somewhere? Let requesters along your route find you.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Trip details</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceAutocomplete label="Origin" placeholder="e.g. Bangalore" value={origin} onSelect={setOrigin} />
              <PlaceAutocomplete label="Destination" placeholder="e.g. Hubli" value={destination} onSelect={setDestination} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="departure">Departure date & time</Label>
                <Input id="departure" type="datetime-local" required value={departureDateTime} onChange={(e) => setDepartureDateTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="arrival">Estimated arrival</Label>
                <Input id="arrival" type="datetime-local" required value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="capacity">Available capacity (kg)</Label>
                <Input id="capacity" type="number" min={0.1} step={0.1} required value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="transport">Mode of transport</Label>
                <Select id="transport" value={transportType} onChange={(e) => setTransportType(e.target.value)}>
                  <option value="TRAIN">Train</option>
                  <option value="BUS">Bus</option>
                  <option value="FLIGHT">Flight</option>
                  <option value="CAR">Car</option>
                  <option value="BIKE">Bike</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Overnight train, plenty of cabin luggage space" />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4" /> : 'Publish trip'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
