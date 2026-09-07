'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { PlaceAutocomplete } from '@/components/place-autocomplete';
import type { PlaceResult } from '@/lib/geocoding';
import { formatINR } from '@/lib/utils';
import { ShieldAlert, ImagePlus } from 'lucide-react';

const PLATFORM_FEE_PERCENT = 10; // matches backend DEFAULT_PLATFORM_FEE_PERCENT; actual fee is confirmed server-side

export default function NewRequestPage() {
  const { token, loading } = useRequireAuth();
  const router = useRouter();

  const [pickup, setPickup] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [weightKg, setWeightKg] = useState('1');
  const [itemValue, setItemValue] = useState('0');
  const [reward, setReward] = useState('150');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rewardNumber = Number(reward) || 0;
  const platformFee = useMemo(() => Math.round(rewardNumber * (PLATFORM_FEE_PERCENT / 100)), [rewardNumber]);
  const total = rewardNumber + platformFee;

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<{ data: { url: string } }>('/uploads/image', formData, token);
      setImageUrl(res.data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pickup || !destination) {
      setError('Please select both a pickup and a destination from the list.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ data: { _id: string } }>('/requests', {
        pickup: pickup.name,
        destination: destination.name,
        pickupCoordinates: { lat: pickup.lat, lng: pickup.lng },
        destinationCoordinates: { lat: destination.lat, lng: destination.lng },
        itemName,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        weightKg: Number(weightKg),
        itemValue: Number(itemValue),
        reward: rewardNumber,
        deliveryDeadline,
      }, token);
      router.push(`/requests/${res.data._id}/matches`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-navy-950 mb-1">Request a delivery</h1>
      <p className="text-sm text-neutral-500 mb-6">Tell us what needs to move, and we&apos;ll find a traveler already heading that way.</p>

      <Card>
        <CardHeader><CardTitle className="text-base">Item & route details</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          <Alert variant="warning" className="mb-4 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Weapons, explosives, illegal drugs, hazardous substances, and other prohibited or stolen goods cannot be transported via CarryMate. Items are screened automatically. <a href="/safety" className="underline">See full policy</a>.</span>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <PlaceAutocomplete label="Pickup location" placeholder="e.g. Bangalore" value={pickup} onSelect={setPickup} />
              <PlaceAutocomplete label="Destination" placeholder="e.g. Hubli" value={destination} onSelect={setDestination} />
            </div>

            <div>
              <Label htmlFor="itemName">Item name</Label>
              <Input id="itemName" required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Engineering Textbook" />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any helpful detail for the traveler" />
            </div>

            <div>
              <Label>Item photo (optional)</Label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />} Upload photo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                {imageUrl && <span className="text-xs text-emerald-600">Photo attached</span>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" min={0.01} step={0.01} required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="value">Item value (₹)</Label>
                <Input id="value" type="number" min={0} required value={itemValue} onChange={(e) => setItemValue(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="reward">Reward (₹)</Label>
                <Input id="reward" type="number" min={1} required value={reward} onChange={(e) => setReward(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="deadline">Delivery deadline</Label>
              <Input id="deadline" type="datetime-local" required value={deliveryDeadline} onChange={(e) => setDeliveryDeadline(e.target.value)} />
            </div>

            <div className="rounded-md bg-surface-muted p-4 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Delivery reward</span><span>{formatINR(rewardNumber)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">CarryMate fee (~{PLATFORM_FEE_PERCENT}%)</span><span>{formatINR(platformFee)}</span></div>
              <div className="mt-1 flex justify-between border-t border-border-subtle pt-1 font-semibold text-navy-950"><span>Total</span><span>{formatINR(total)}</span></div>
              <p className="mt-1 text-xs text-neutral-400">Final fee is confirmed by the platform at checkout.</p>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner className="h-4 w-4" /> : 'Publish request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
