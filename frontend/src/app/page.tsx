import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RouteLine } from '@/components/route-line';
import {
  ShieldCheck, MapPin, Clock, Wallet, Star, Package,
  UserCheck, MessageCircle, KeyRound, CheckCircle2, TrendingUp, Quote,
} from 'lucide-react';

const HOW_IT_WORKS_TRAVELER = [
  { icon: UserCheck, title: 'Post your trip', body: 'Already heading somewhere? Add your route, dates, and how much space you have to spare.' },
  { icon: Package, title: 'Get matched', body: 'Our matching engine finds delivery requests along your exact route — no detours.' },
  { icon: KeyRound, title: 'Verify & deliver', body: 'Pickup and drop-off are both OTP-verified, so there is never any ambiguity about handoffs.' },
  { icon: Wallet, title: 'Get paid', body: 'Once the requester confirms receipt, your reward is recorded and ready to withdraw.' },
];

const HOW_IT_WORKS_REQUESTER = [
  { icon: Package, title: 'Describe your item', body: 'Tell us what needs to move, where from, where to, and by when.' },
  { icon: Star, title: 'Pick your traveler', body: 'Compare verified travelers by match score, rating, and available capacity.' },
  { icon: MessageCircle, title: 'Coordinate pickup', body: 'Chat directly, share the pickup OTP, and track your item to IN_TRANSIT.' },
  { icon: CheckCircle2, title: 'Confirm delivery', body: 'Verify the delivery OTP, confirm receipt, and rate your traveler.' },
];

const POPULAR_ROUTES = [
  { from: 'Bangalore', to: 'Hubli', reward: '₹150', count: '38 trips this week' },
  { from: 'Bangalore', to: 'Dharwad', reward: '₹100', count: '21 trips this week' },
  { from: 'Mysore', to: 'Bangalore', reward: '₹80', count: '54 trips this week' },
];

const TESTIMONIALS = [
  { name: 'Priya N.', role: 'Requester', quote: 'Needed my charger delivered same week — a verified traveler picked it up the next morning. The OTP handoff made it feel completely safe.' },
  { name: 'Mahesh K.', role: 'Traveler, 23 deliveries', quote: 'I take the same train every month anyway. Now I earn a bit extra just for carrying a small package.' },
  { name: 'Arjun P.', role: 'Requester', quote: 'The match score and traveler ratings made it easy to pick someone I trusted with a valuable item.' },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-orange-300 mb-5">
                Peer-to-peer delivery, powered by real journeys
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
                Going there anyway?
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-orange-400 leading-tight mt-1">
                Carry it. Earn from it.
              </h2>
              <p className="mt-5 text-neutral-300 text-lg max-w-md">
                CarryMate connects travelers with people who need items delivered along their route.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register?role=traveler"><Button variant="accent" size="lg">I&apos;m Traveling</Button></Link>
                <Link href="/register?role=requester"><Button variant="outline" size="lg" className="bg-white/5 text-white border-white/20 hover:bg-white/10">I Need Something Delivered</Button></Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> OTP-verified handoffs</span>
                <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-orange-400" /> Rated & trusted travelers</span>
              </div>
            </div>

            <Card className="bg-white text-navy-950 p-1">
              <CardContent className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-4">Live route match</p>
                <RouteLine origin="Bangalore" destination="Hubli" rewardLabel="₹150 reward" />
                <div className="mt-5 flex items-center justify-between rounded-md bg-surface-muted px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-navy-700" />
                    <span className="font-medium">Engineering Textbook · 1kg</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">97% match</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-navy-950 text-center">How CarryMate works</h2>
        <p className="text-center text-neutral-500 mt-2 max-w-xl mx-auto">Two sides of one marketplace — a route, and something that needs to travel along it.</p>

        <div className="grid gap-10 md:grid-cols-2 mt-10">
          <div>
            <h3 className="font-semibold text-navy-900 mb-4">For Travelers</h3>
            <div className="space-y-4">
              {HOW_IT_WORKS_TRAVELER.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm">{step.title}</p>
                    <p className="text-sm text-neutral-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy-900 mb-4">For Requesters</h3>
            <div className="space-y-4">
              {HOW_IT_WORKS_REQUESTER.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/10 text-navy-800">
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="font-medium text-navy-950 text-sm">{step.title}</p>
                    <p className="text-sm text-neutral-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety & verification */}
      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-bold text-navy-950">Safety & verification</h2>
              <p className="text-neutral-600 mt-3 text-sm">
                Strangers are carrying real items — so trust is built into every step, not bolted on after.
              </p>
            </div>
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
              {[
                { icon: KeyRound, title: 'Two-stage OTP', body: 'Separate pickup and delivery codes prevent false handoff confirmations.' },
                { icon: ShieldCheck, title: 'Identity verification', body: 'Travelers can verify ID documents to unlock a Verified badge.' },
                { icon: Star, title: 'Ratings & trust score', body: 'Every completed delivery builds a visible, weighted reputation.' },
                { icon: MapPin, title: 'Prohibited item screening', body: 'Weapons, drugs, hazardous or stolen goods are blocked automatically.' },
              ].map((f, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <f.icon className="h-5 w-5 text-navy-800 mb-2" />
                    <p className="font-medium text-sm text-navy-950">{f.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why CarryMate */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-navy-950 text-center mb-10">Why CarryMate</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-navy-950">Faster than courier networks</p>
            <p className="text-sm text-neutral-500 mt-1">Your item travels on a journey that&apos;s already happening.</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-navy-950">Earn from trips you already take</p>
            <p className="text-sm text-neutral-500 mt-1">Turn spare luggage capacity into extra income.</p>
          </div>
          <div className="text-center">
            <ShieldCheck className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="font-semibold text-navy-950">Verified, accountable, human</p>
            <p className="text-sm text-neutral-500 mt-1">Real people, real ratings — not an anonymous parcel network.</p>
          </div>
        </div>
      </section>

      {/* Popular routes */}
      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy-950 text-center mb-10">Popular routes</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {POPULAR_ROUTES.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <RouteLine origin={r.from} destination={r.to} rewardLabel={r.reward} />
                  <p className="text-xs text-neutral-500 mt-4">{r.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-navy-950 text-center mb-10">What the community says</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Quote className="h-5 w-5 text-orange-500 mb-2" />
                <p className="text-sm text-neutral-700">{t.quote}</p>
                <p className="text-xs text-neutral-500 mt-3 font-medium">{t.name} · {t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-950 text-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold">Going there anyway?</h2>
          <p className="text-neutral-300 mt-2">Join CarryMate and turn your next trip into someone&apos;s delivery — and your extra earnings.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register?role=traveler"><Button variant="accent" size="lg">I&apos;m Traveling</Button></Link>
            <Link href="/register?role=requester"><Button variant="outline" size="lg" className="bg-white/5 text-white border-white/20 hover:bg-white/10">I Need Something</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
