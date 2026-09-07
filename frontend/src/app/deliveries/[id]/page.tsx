'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { api, ApiError } from '@/lib/api';
import { config } from '@/lib/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { StatusPill } from '@/components/status-pill';
import { StarRatingInput } from '@/components/star-rating-input';
import { formatDate, formatINR, timeAgo } from '@/lib/utils';
import type { Delivery, DeliveryRequest, Trip, User, Message } from '@/lib/types';
import { KeyRound, Send, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayCheckout {
  new (options: RazorpayCheckoutOptions): { open: () => void };
}
declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

const STATE_ORDER = [
  'REQUESTED', 'MATCHED', 'TRAVELER_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED',
  'PICKUP_PENDING', 'ITEM_PICKED_UP', 'IN_TRANSIT', 'DELIVERY_PENDING', 'DELIVERED', 'COMPLETED',
];

export default function DeliveryDetailPage() {
  const { user, token, loading } = useRequireAuth();
  const params = useParams<{ id: string }>();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [pickupCode, setPickupCode] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [myRating, setMyRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const loadDelivery = useCallback(async () => {
    if (!token) return;
    const res = await api.get<{ data: Delivery }>(`/deliveries/${params.id}`, token);
    setDelivery(res.data);
    return res.data;
  }, [token, params.id]);

  const loadConversation = useCallback(async (deliveryRequestId: string) => {
    if (!token) return;
    try {
      const res = await api.get<{ data: { _id: string; deliveryRequestId: { _id: string } }[] }>('/conversations', token);
      const convo = res.data.find((c) => c.deliveryRequestId._id === deliveryRequestId);
      if (convo) {
        setConversationId(convo._id);
        const msgRes = await api.get<{ data: Message[] }>(`/conversations/${convo._id}/messages`, token);
        setMessages(msgRes.data);
      }
    } catch {
      // Conversation may not exist yet (created once payment is confirmed).
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setBusy(true);
      try {
        const d = await loadDelivery();
        const reqId = d && typeof d.deliveryRequestId === 'object' ? (d.deliveryRequestId as DeliveryRequest)._id : null;
        if (reqId) await loadConversation(reqId);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load delivery');
      } finally {
        setBusy(false);
      }
    })();
  }, [token, loadDelivery, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading || busy || !delivery) {
    return <div className="flex justify-center py-24"><Spinner className="h-6 w-6 text-navy-700" /></div>;
  }

  const request = typeof delivery.deliveryRequestId === 'object' ? (delivery.deliveryRequestId as DeliveryRequest) : null;
  const trip = typeof delivery.tripId === 'object' ? (delivery.tripId as Trip) : null;
  const traveler = typeof delivery.travelerId === 'object' ? (delivery.travelerId as User) : null;
  const requester = typeof delivery.requesterId === 'object' ? (delivery.requesterId as User) : null;
  const isTraveler = user?._id === traveler?._id;
  const isRequester = user?._id === requester?._id;
  const otherParty = isTraveler ? requester : traveler;

  async function runAction(fn: () => Promise<void>) {
    setActionBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      await loadDelivery();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAccept() {
    await runAction(async () => {
      await api.post(`/deliveries/${params.id}/accept`, {}, token);
    });
  }

  async function handlePay() {
    if (!request) return;
    await runAction(async () => {
      const orderRes = await api.post<{ data: { orderId: string; amount: number; isDemo: boolean; keyId?: string } }>(
        '/payments/create-order',
        { deliveryRequestId: request._id },
        token
      );
      const order = orderRes.data;

      if (order.isDemo) {
        const paymentId = `demo_pay_${Date.now()}`;
        const sigRes = await api.get<{ data: { signature: string } }>(
          `/payments/demo-signature?orderId=${order.orderId}&paymentId=${paymentId}`,
          token
        );
        const verifyRes = await api.post<{ pickupOtp: { code: string; expiresAt: string } }>('/payments/verify', {
          deliveryRequestId: request._id,
          razorpayOrderId: order.orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: sigRes.data.signature,
        }, token);
        setInfo(`Demo payment verified. Pickup OTP: ${verifyRes.pickupOtp.code} (share this with your traveler in person). This is a simulated payment — no real money moved.`);
      } else {
        // Real Razorpay Checkout flow.
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            if (!window.Razorpay) return reject(new Error('Failed to load Razorpay checkout'));
            const rzp = new window.Razorpay({
              key: order.keyId || config.razorpayKeyId,
              amount: order.amount,
              currency: 'INR',
              order_id: order.orderId,
              name: 'CarryMate',
              description: request.itemName,
              handler: async (response) => {
                try {
                  const verifyRes = await api.post<{ pickupOtp: { code: string } }>('/payments/verify', {
                    deliveryRequestId: request._id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  }, token);
                  setInfo(`Payment verified. Pickup OTP: ${verifyRes.pickupOtp.code}`);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              },
              modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
            });
            rzp.open();
          };
          document.body.appendChild(script);
        });
      }
    });
  }

  async function handleGeneratePickupOtp() {
    await runAction(async () => {
      const res = await api.post<{ data: { code: string } }>(`/deliveries/${params.id}/pickup/generate-otp`, {}, token);
      setInfo(`Pickup OTP: ${res.data.code} — share this with your traveler when you hand over the item.`);
    });
  }

  async function handleVerifyPickup() {
    await runAction(async () => {
      await api.post(`/deliveries/${params.id}/pickup/verify`, { code: pickupCode }, token);
      setPickupCode('');
    });
  }

  async function handleGenerateDeliveryOtp() {
    await runAction(async () => {
      const res = await api.post<{ data: { code: string } }>(`/deliveries/${params.id}/delivery/generate-otp`, {}, token);
      setInfo(`Delivery OTP: ${res.data.code} — share this with your traveler when you receive the item.`);
    });
  }

  async function handleVerifyDelivery() {
    await runAction(async () => {
      await api.post(`/deliveries/${params.id}/delivery/verify`, { code: deliveryCode }, token);
      setDeliveryCode('');
    });
  }

  async function handleConfirm() {
    await runAction(async () => {
      await api.post(`/deliveries/${params.id}/confirm`, {}, token);
    });
  }

  async function handleCancel() {
    if (!confirm('Cancel this delivery? This cannot be undone.')) return;
    await runAction(async () => {
      await api.post(`/deliveries/${params.id}/cancel`, { reason: 'Cancelled by user' }, token);
    });
  }

  async function handleSendMessage() {
    if (!conversationId || !messageText.trim()) return;
    const text = messageText;
    setMessageText('');
    const res = await api.post<{ data: Message }>(`/conversations/${conversationId}/messages`, { message: text }, token);
    setMessages((prev) => [...prev, res.data]);
  }

  async function handleRate() {
    if (!request || !otherParty) return;
    await runAction(async () => {
      await api.post('/ratings', {
        deliveryRequestId: request._id,
        revieweeId: otherParty._id,
        rating: myRating,
        comment: ratingComment || undefined,
      }, token);
      setHasRated(true);
      setInfo('Thanks for rating your delivery partner!');
    });
  }

  const currentIndex = STATE_ORDER.indexOf(delivery.state);
  const cancellableStates = ['REQUESTED', 'MATCHED', 'TRAVELER_ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'PICKUP_PENDING'];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-navy-950">{request?.itemName || 'Delivery'}</h1>
        <StatusPill state={delivery.state} />
      </div>
      {request && <p className="text-sm text-neutral-500 mb-6">{request.pickup} → {request.destination} · {formatINR(request.reward)} reward</p>}

      {request?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- item photos may be data: URLs (demo mode) or remote storage URLs
        <img src={request.imageUrl} alt={request.itemName} className="mb-6 h-40 w-full rounded-lg object-cover border border-border-subtle" />
      )}

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {info && <Alert variant="success" className="mb-4">{info}</Alert>}

      {/* State timeline */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-2">
            {STATE_ORDER.map((s, i) => (
              <span key={s} className={`text-xs px-2 py-1 rounded-full ${i <= currentIndex ? 'bg-navy-900 text-white' : 'bg-surface-muted text-neutral-400'}`}>
                {s.replaceAll('_', ' ')}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Participants */}
        <Card>
          <CardHeader><CardTitle className="text-base">Participants</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {traveler && <div className="flex justify-between"><span className="text-neutral-500">Traveler</span><span className="font-medium">{traveler.name}{isTraveler && ' (you)'}</span></div>}
            {requester && <div className="flex justify-between"><span className="text-neutral-500">Requester</span><span className="font-medium">{requester.name}{isRequester && ' (you)'}</span></div>}
            {trip && <div className="flex justify-between"><span className="text-neutral-500">Departure</span><span className="font-medium">{formatDate(trip.departureDateTime)}</span></div>}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {delivery.state === 'MATCHED' && isTraveler && (
              <Button className="w-full" onClick={handleAccept} disabled={actionBusy}>
                {actionBusy ? <Spinner className="h-4 w-4" /> : 'Accept this delivery'}
              </Button>
            )}

            {delivery.state === 'PAYMENT_PENDING' && isRequester && (
              <Button className="w-full" variant="accent" onClick={handlePay} disabled={actionBusy}>
                {actionBusy ? <Spinner className="h-4 w-4" /> : `Pay ${request ? formatINR(request.reward) : ''} & confirm`}
              </Button>
            )}

            {delivery.state === 'PICKUP_PENDING' && isRequester && (
              <Button variant="outline" className="w-full" onClick={handleGeneratePickupOtp} disabled={actionBusy}>
                <KeyRound className="h-4 w-4" /> Show pickup OTP
              </Button>
            )}
            {delivery.state === 'PICKUP_PENDING' && isTraveler && (
              <div className="flex gap-2">
                <Input placeholder="Enter pickup OTP" value={pickupCode} onChange={(e) => setPickupCode(e.target.value)} maxLength={6} />
                <Button onClick={handleVerifyPickup} disabled={actionBusy || pickupCode.length !== 6}>Verify</Button>
              </div>
            )}

            {(delivery.state === 'IN_TRANSIT' || delivery.state === 'DELIVERY_PENDING') && isRequester && (
              <Button variant="outline" className="w-full" onClick={handleGenerateDeliveryOtp} disabled={actionBusy}>
                <KeyRound className="h-4 w-4" /> {delivery.state === 'IN_TRANSIT' ? "I'm ready to receive — get delivery OTP" : 'Show delivery OTP again'}
              </Button>
            )}
            {delivery.state === 'DELIVERY_PENDING' && isTraveler && (
              <div className="flex gap-2">
                <Input placeholder="Enter delivery OTP" value={deliveryCode} onChange={(e) => setDeliveryCode(e.target.value)} maxLength={6} />
                <Button onClick={handleVerifyDelivery} disabled={actionBusy || deliveryCode.length !== 6}>Verify</Button>
              </div>
            )}

            {delivery.state === 'DELIVERED' && isRequester && (
              <Button className="w-full" variant="success" onClick={handleConfirm} disabled={actionBusy}>
                <CheckCircle2 className="h-4 w-4" /> Confirm receipt & release earnings
              </Button>
            )}

            {delivery.state === 'COMPLETED' && !hasRated && otherParty && (
              <div className="space-y-2 rounded-md bg-surface-muted p-3">
                <p className="text-sm font-medium text-navy-950">Rate {otherParty.name}</p>
                <StarRatingInput value={myRating} onChange={setMyRating} />
                <Input placeholder="Optional comment" value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
                <Button size="sm" onClick={handleRate} disabled={actionBusy} className="w-full">Submit rating</Button>
              </div>
            )}

            {delivery.state === 'COMPLETED' && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600"><ShieldCheck className="h-4 w-4" /> Delivery completed successfully.</p>
            )}

            {cancellableStates.includes(delivery.state) && (isTraveler || isRequester) && (
              <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50" onClick={handleCancel} disabled={actionBusy}>
                <XCircle className="h-4 w-4" /> Cancel delivery
              </Button>
            )}

            {!['MATCHED', 'PAYMENT_PENDING', 'PICKUP_PENDING', 'IN_TRANSIT', 'DELIVERY_PENDING', 'DELIVERED', 'COMPLETED'].includes(delivery.state) && (
              <p className="text-sm text-neutral-500">No action needed right now.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      {conversationId && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">Chat with {otherParty?.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 pr-1">
              {messages.length === 0 && <p className="text-sm text-neutral-400">No messages yet — say hello!</p>}
              {messages.map((m) => (
                <div key={m._id} className={`flex ${m.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.senderId === user?._id ? 'bg-navy-900 text-white' : 'bg-surface-muted text-navy-950'}`}>
                    {m.message}
                    <div className="text-[10px] opacity-60 mt-0.5">{timeAgo(m.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
