'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchScoreRing } from '@/components/match-score-ring';
import { TrustSummary } from '@/components/trust-summary';
import { RouteLine } from '@/components/route-line';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import type { Trip, User } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';

interface ScoredMatch {
  match: { _id: string; matchScore: number };
  trip: Trip;
  traveler: User;
  explanation: string[];
}

export default function RequestMatchesPage() {
  const { token, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingTripId, setSelectingTripId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setBusy(true);
      try {
        const res = await api.get<{ data: ScoredMatch[] }>(`/matches/request/${params.id}`, token);
        setMatches(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load matches');
      } finally {
        setBusy(false);
      }
    })();
  }, [token, params.id]);

  async function handleSelect(tripId: string) {
    setSelectingTripId(tripId);
    setError(null);
    try {
      await api.post(`/requests/${params.id}/select-traveler`, { tripId }, token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to select traveler');
    } finally {
      setSelectingTripId(null);
    }
  }

  if (loading || busy) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Matching travelers</h1>
      <p className="text-sm text-neutral-500 mb-6">Sorted by match score — route, timing, capacity, proximity, and traveler reputation.</p>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {matches.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-neutral-500">No matching travelers yet. Check back soon, or widen your delivery deadline.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {matches.map(({ match, trip, traveler, explanation }) => (
            <Card key={match._id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <MatchScoreRing score={match.matchScore} />
                    <div>
                      <RouteLine origin={trip.origin} destination={trip.destination} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy-950">{traveler.name}</p>
                    <TrustSummary user={traveler} compact />
                    <p className="text-xs text-neutral-500 mt-1">Departs {formatDate(trip.departureDateTime)}</p>
                    <p className="text-xs text-neutral-500">Available capacity: {trip.availableCapacityKg}kg</p>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-surface-muted p-3">
                  <p className="text-xs font-medium text-neutral-500 mb-1.5">Why this match?</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-700">
                    {explanation.map((e, i) => (
                      <span key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {e}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={() => handleSelect(trip._id)} disabled={selectingTripId === trip._id}>
                    {selectingTripId === trip._id ? <Spinner className="h-4 w-4" /> : 'Select this traveler'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
