'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RouteLine } from '@/components/route-line';
import { TrustSummary } from '@/components/trust-summary';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import type { Trip, User } from '@/lib/types';
import { Search } from 'lucide-react';

export default function BrowseTripsPage() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(true);

  async function load() {
    setBusy(true);
    try {
      const qs = new URLSearchParams({ limit: '20' });
      if (origin) qs.set('origin', origin);
      if (destination) qs.set('destination', destination);
      const res = await api.get<{ data: Trip[] }>(`/trips?${qs.toString()}`, token);
      setTrips(res.data);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount/token-change is intentional
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-neutral-500 mb-4">Log in to browse active trips.</p>
        <Link href="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Browse trips</h1>
      <p className="text-sm text-neutral-500 mb-6">Find a traveler already heading where your item needs to go.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className="max-w-[200px]" />
        <Input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="max-w-[200px]" />
        <Button variant="outline" onClick={load}><Search className="h-4 w-4" /> Search</Button>
      </div>

      {busy ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-navy-700" /></div>
      ) : trips.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-neutral-500">No active trips match your search.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const traveler = typeof trip.travelerId === 'object' ? (trip.travelerId as User) : null;
            return (
              <Card key={trip._id}>
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <RouteLine origin={trip.origin} destination={trip.destination} />
                  <div className="text-right">
                    {traveler && (
                      <>
                        <p className="font-medium text-navy-950">{traveler.name}</p>
                        <TrustSummary user={traveler} compact />
                      </>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">{formatDate(trip.departureDateTime)} · {trip.availableCapacityKg}kg free</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
