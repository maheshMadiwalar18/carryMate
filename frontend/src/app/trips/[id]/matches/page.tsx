'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { MatchScoreRing } from '@/components/match-score-ring';
import { RouteLine } from '@/components/route-line';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatINR } from '@/lib/utils';
import type { DeliveryRequest } from '@/lib/types';
import { CheckCircle2, Package } from 'lucide-react';

interface ScoredMatch {
  match: { _id: string; matchScore: number };
  request: DeliveryRequest;
  explanation: string[];
}

export default function TripMatchesPage() {
  const { token, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();

  const [matches, setMatches] = useState<ScoredMatch[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setBusy(true);
      try {
        const res = await api.get<{ data: ScoredMatch[] }>(`/matches/trip/${params.id}`, token);
        setMatches(res.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load matches');
      } finally {
        setBusy(false);
      }
    })();
  }, [token, params.id]);

  if (loading || busy) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Matching delivery requests</h1>
      <p className="text-sm text-neutral-500 mb-6">Requesters see you too — once they select you, you&apos;ll be notified to accept.</p>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {matches.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-neutral-500">No matching delivery requests along this route yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {matches.map(({ match, request, explanation }) => (
            <Card key={match._id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <MatchScoreRing score={match.matchScore} />
                    <RouteLine origin={request.pickup} destination={request.destination} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy-950 flex items-center gap-1.5 justify-end"><Package className="h-4 w-4" /> {request.itemName}</p>
                    <p className="text-xs text-neutral-500 mt-1">{request.weightKg}kg · reward {formatINR(request.reward)}</p>
                    <p className="text-xs text-neutral-500">Deadline {formatDate(request.deliveryDeadline)}</p>
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
                <p className="mt-3 text-xs text-neutral-400">Waiting for the requester to select you for this delivery.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
