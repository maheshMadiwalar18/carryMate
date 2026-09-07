'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RouteLine } from '@/components/route-line';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatINR } from '@/lib/utils';
import type { DeliveryRequest } from '@/lib/types';
import { Search, Package } from 'lucide-react';

export default function BrowseRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(true);

  async function load() {
    setBusy(true);
    try {
      const qs = new URLSearchParams({ limit: '20' });
      if (pickup) qs.set('pickup', pickup);
      if (destination) qs.set('destination', destination);
      const res = await api.get<{ data: DeliveryRequest[] }>(`/requests?${qs.toString()}`, token);
      setRequests(res.data);
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
        <p className="text-neutral-500 mb-4">Log in to browse open delivery requests.</p>
        <Link href="/login"><Button>Log in</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Browse delivery requests</h1>
      <p className="text-sm text-neutral-500 mb-6">See what needs to move along routes you already travel.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder="Pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} className="max-w-[200px]" />
        <Input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="max-w-[200px]" />
        <Button variant="outline" onClick={load}><Search className="h-4 w-4" /> Search</Button>
      </div>

      {busy ? (
        <div className="flex justify-center py-12"><Spinner className="h-6 w-6 text-navy-700" /></div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-neutral-500">No open requests match your search.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req._id}>
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                <RouteLine origin={req.pickup} destination={req.destination} />
                <div className="text-right">
                  <p className="font-medium text-navy-950 flex items-center gap-1.5 justify-end"><Package className="h-4 w-4" /> {req.itemName}</p>
                  <p className="text-xs text-neutral-500">{req.weightKg}kg · reward {formatINR(req.reward)}</p>
                  <p className="text-xs text-neutral-500">Deadline {formatDate(req.deliveryDeadline)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
