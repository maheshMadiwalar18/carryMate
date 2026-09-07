'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { StatusPill } from '@/components/status-pill';
import { formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';
import { Star, ShieldCheck, Package, Truck, Calendar } from 'lucide-react';

interface RatingEntry {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerId: { name: string; profileImage?: string };
}

export default function ProfilePage() {
  const { token, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const [profile, setProfile] = useState<User | null>(null);
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setBusy(true);
      try {
        const [profileRes, ratingsRes] = await Promise.all([
          api.get<{ data: User }>(`/users/${params.id}`, token),
          api.get<{ data: RatingEntry[] }>(`/users/${params.id}/ratings`, token),
        ]);
        setProfile(profileRes.data);
        setRatings(ratingsRes.data);
      } finally {
        setBusy(false);
      }
    })();
  }, [token, params.id]);

  if (loading || busy || !profile) {
    return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-2xl font-bold text-white">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-950 flex items-center gap-2">
                {profile.name}
                {profile.verificationStatus === 'VERIFIED' && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
              </h1>
              <p className="text-sm text-neutral-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Member since {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          {profile.bio && <p className="mt-4 text-sm text-neutral-600">{profile.bio}</p>}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<Star className="h-4 w-4 text-orange-500" />} label="Rating" value={`${profile.rating.toFixed(1)} (${profile.totalRatings})`} />
            <Stat icon={<Package className="h-4 w-4 text-navy-700" />} label="Deliveries" value={String(profile.completedDeliveries)} />
            <Stat icon={<Truck className="h-4 w-4 text-navy-700" />} label="Trips" value={String(profile.completedTrips)} />
            <Stat icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Trust score" value={String(profile.trustScore)} />
          </div>

          <div className="mt-4">
            <StatusPill state={profile.verificationStatus} />
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-navy-950 mt-8 mb-3">Reviews</h2>
      {ratings.length === 0 ? (
        <p className="text-sm text-neutral-500">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {ratings.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-navy-950">{r.reviewerId?.name || 'CarryMate user'}</p>
                  <span className="flex items-center gap-1 text-sm text-orange-600">
                    <Star className="h-3.5 w-3.5 fill-orange-500" /> {r.rating}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-neutral-600 mt-1">{r.comment}</p>}
                <p className="text-xs text-neutral-400 mt-1">{formatDate(r.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">{icon} {label}</div>
      <p className="font-semibold text-navy-950 mt-0.5">{value}</p>
    </div>
  );
}
