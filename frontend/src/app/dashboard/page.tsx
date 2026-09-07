'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/hooks';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/status-pill';
import { RouteLine } from '@/components/route-line';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatINR } from '@/lib/utils';
import type { Trip, DeliveryRequest, Delivery } from '@/lib/types';
import { Plus, Package, Truck } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, token } = useRequireAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user || !token) return;
    (async () => {
      setBusy(true);
      try {
        const [tripsRes, requestsRes, deliveriesRes] = await Promise.all([
          api.get<{ data: Trip[] }>(`/trips?travelerId=${user._id}&limit=10`, token),
          api.get<{ data: DeliveryRequest[] }>(`/requests?requesterId=${user._id}&limit=10`, token),
          api.get<{ data: Delivery[] }>('/deliveries', token),
        ]);
        setTrips(tripsRes.data);
        setRequests(requestsRes.data);
        setDeliveries(deliveriesRes.data);
      } finally {
        setBusy(false);
      }
    })();
  }, [user, token]);

  if (loading || !user) {
    return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;
  }

  const activeDeliveries = deliveries.filter((d) => !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(d.state));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">{greeting}, {user.name.split(' ')[0]}</h1>
          <p className="text-sm text-neutral-500">Here&apos;s what&apos;s happening with your trips and requests.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trips/new"><Button variant="outline"><Plus className="h-4 w-4" /> New Trip</Button></Link>
          <Link href="/requests/new"><Button variant="accent"><Plus className="h-4 w-4" /> New Request</Button></Link>
        </div>
      </div>

      {busy ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-navy-700" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active deliveries */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4.5 w-4.5" /> Active deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {activeDeliveries.length === 0 ? (
                <p className="text-sm text-neutral-500">No active deliveries right now.</p>
              ) : (
                <div className="space-y-3">
                  {activeDeliveries.map((d) => {
                    const req = typeof d.deliveryRequestId === 'object' ? d.deliveryRequestId : null;
                    return (
                      <Link key={d._id} href={`/deliveries/${d._id}`}>
                        <div className="flex items-center justify-between rounded-md border border-border-subtle p-3 hover:bg-surface-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-navy-700" />
                            <div>
                              <p className="text-sm font-medium text-navy-950">{req?.itemName || 'Delivery'}</p>
                              <p className="text-xs text-neutral-500">{req ? `${req.pickup} → ${req.destination}` : ''}</p>
                            </div>
                          </div>
                          <StatusPill state={d.state} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming trips */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Your trips</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {trips.length === 0 && <p className="text-sm text-neutral-500">You haven&apos;t posted any trips yet.</p>}
              {trips.map((trip) => (
                <div key={trip._id} className="flex items-center justify-between rounded-md border border-border-subtle p-3">
                  <RouteLine origin={trip.origin} destination={trip.destination} />
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">{formatDate(trip.departureDateTime)}</p>
                    <p className="text-xs text-neutral-500">{trip.availableCapacityKg}kg free</p>
                    <Link href={`/trips/${trip._id}/matches`} className="text-xs font-medium text-navy-900 hover:underline">
                      View matches →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reputation snapshot */}
          <Card>
            <CardHeader><CardTitle className="text-base">Your standing</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Rating</span><span className="font-medium">{user.rating?.toFixed(1) ?? '—'} / 5</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Completed deliveries</span><span className="font-medium">{user.completedDeliveries}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Completed trips</span><span className="font-medium">{user.completedTrips}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Trust score</span><span className="font-medium">{user.trustScore}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Verification</span><StatusPill state={user.verificationStatus} /></div>
              <Link href={`/profile/${user._id}`} className="block text-xs font-medium text-navy-900 hover:underline pt-1">View public profile →</Link>
            </CardContent>
          </Card>

          {/* Requests */}
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="text-base">Your delivery requests</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 && <p className="text-sm text-neutral-500">You haven&apos;t posted any delivery requests yet.</p>}
              {requests.map((req) => (
                <div key={req._id} className="flex items-center justify-between rounded-md border border-border-subtle p-3">
                  <div>
                    <p className="text-sm font-medium text-navy-950">{req.itemName}</p>
                    <p className="text-xs text-neutral-500">{req.pickup} → {req.destination} · {formatINR(req.reward)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill state={req.status} />
                    <Link href={`/requests/${req._id}/matches`} className="text-xs font-medium text-navy-900 hover:underline">
                      Matches →
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
