# CarryMate

**Going there anyway? CarryMate it.**

CarryMate is a peer-to-peer travel delivery marketplace. Travelers who are already
going from A to B post their trip; people who need a small item moved along that
same route post a request; a geospatial matching engine connects them; the item
travels inside a journey that was happening anyway.

> Traveler + Requester + Route + Match — that's the whole product. Trust (OTP
> handoffs, verification, ratings), payments, and chat exist to make that core
> loop safe, not to replace it.

---

## 1. Product overview

Two roles, one marketplace:

- **Traveler** — posts a trip (origin, destination, dates, spare capacity),
  browses/accepts matching delivery requests, completes OTP-verified pickup
  and drop-off, gets paid.
- **Requester** — posts an item to move (pickup, destination, weight, value,
  reward), picks a matched traveler, pays, tracks the delivery, confirms
  receipt, rates the traveler.

Every account can act as both — there's no separate signup flow per role.

## 2. Features

- Trip creation/editing/cancellation with capacity tracking
- Delivery request creation/editing/cancellation with automatic prohibited-item
  screening (name **and** description are checked — you can't hide a banned
  item behind an innocuous title)
- Geospatial matching engine (route, date, capacity, pickup proximity,
  traveler reputation — weighted 40/25/15/10/10) that recognizes *nearby*
  cities as compatible routes, not just exact string matches
- A strictly-enforced delivery state machine (14 states, invalid transitions
  rejected server-side, no exceptions for "trusted" clients)
- Two-stage OTP verification (pickup and delivery are independent, hashed,
  expiring, attempt-limited codes) so neither party can falsely claim a
  handoff happened
- Payments via Razorpay order-creation + signature verification, with a
  transparent commission split, running in a fully working demo mode when no
  Razorpay keys are configured
- Real-time-ready chat scoped to a single delivery, created automatically once
  payment clears
- Ratings (one per delivery per direction, duplicates rejected) feeding a
  weighted reputation score and a separate trust score
- ID verification workflow with an admin review queue
- Reporting/dispute intake feeding into a `DISPUTED` delivery state
- Admin dashboard: users, trips, requests, transactions, verifications,
  reports, live marketplace analytics, and a configurable platform fee
- Structured error responses everywhere (`{ success, message, code }`), no
  stack traces or secrets ever returned to the client

## 3. Architecture

```
carrymate/
├── backend/     Express + TypeScript REST API, Mongoose/MongoDB
├── frontend/    Next.js (App Router) + TypeScript + Tailwind
└── docker-compose.yml   optional local MongoDB for development
```

**Backend layering:** `routes` (HTTP + validation wiring) → `controllers`
(request/response, authorization checks) → `services` (matching engine,
delivery state machine, OTP, payments, trust scoring — all pure/testable) →
`models` (Mongoose schemas with indexes). Cross-cutting concerns
(`middleware/auth.ts`, `middleware/errorHandler.ts`, `middleware/validate.ts`)
are applied at the route layer.

**Frontend:** App Router pages call a thin typed `lib/api.ts` client. All
auth state lives in `lib/auth-context.tsx`, which transparently switches
between real Firebase Authentication and a self-contained demo-JWT mode
depending on environment configuration — the rest of the app never needs to
know which mode is active.

**A deliberate MVP decision:** the "traveler accepts" and "payment" steps are
modeled as two separate delivery-state transitions (`MATCHED` →
`TRAVELER_ACCEPTED` → `PAYMENT_PENDING`) that fire back-to-back in one API
call, because in practice a traveler accepting a request and the system
opening a payment window are the same moment from the user's perspective, but
keeping them as distinct states preserves an accurate audit trail
(`stateHistory`) and keeps the transition table honest.

## 4. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn-style components, lucide-react |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Atlas in production; local Docker or `mongodb-memory-server` for dev) via Mongoose |
| Auth | Firebase Authentication (email/password, Google, phone-ready) with a built-in demo-JWT fallback |
| Storage | Firebase Storage, with an inline base64 fallback when unconfigured |
| Maps | Mapbox or Google Geocoding, with a static demo gazetteer fallback |
| Payments | Razorpay Orders API + signature verification, with a fully functional demo mode |
| Validation | Zod on every mutating endpoint |

### Real vs. demo mode — how this actually works

Every external integration (Firebase, Razorpay, Maps, MongoDB Atlas) is wired
for real, but the app is designed to run **completely functionally without
any of them configured**, because that's the only honest way to ship an MVP
that a reviewer can actually run on a clean machine:

| Integration | Unconfigured (demo mode) | Configured |
|---|---|---|
| MongoDB | Ephemeral in-memory MongoDB (`mongodb-memory-server`), auto-seeded on boot | Your Atlas/local `MONGODB_URI` |
| Firebase Auth | Backend issues its own JWTs from `/api/auth/register` + `/login` | Firebase ID tokens verified server-side via `firebase-admin` |
| Firebase Storage | Uploaded images returned as inline `data:` URLs | Uploaded to your Storage bucket, public URL returned |
| Maps | Static gazetteer of ~14 Indian cities (covers all seed data) | Live Mapbox/Google geocoding across India |
| Razorpay | Local pseudo-orders + a deterministic HMAC-style demo signature — **no real money moves, ever** | Real Razorpay Orders + Checkout + signature verification |

The backend's `/api/health` endpoint reports which mode each subsystem is
running in, so it's never ambiguous.

## 5. Setup instructions

### Prerequisites
- Node.js 20+
- npm
- (Optional) Docker, for local MongoDB
- (Optional) Firebase project, Razorpay account, Mapbox/Google Maps API key —
  none of these are required to run the full app

### Quick start (fully demo mode, zero external accounts needed)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev
# → API on http://localhost:4000, in-memory DB auto-seeded with demo accounts

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev
# → App on http://localhost:3000
```

Log in with one of the seeded demo accounts (password `password123` for all):

| Email | Role |
|---|---|
| `mahesh@example.com` | Traveler — Bangalore → Hubli, 5kg |
| `rahul@example.com` | Traveler — Bangalore → Dharwad, 3kg |
| `ananya@example.com` | Traveler — Mysore → Bangalore, 2kg |
| `priya@example.com` | Requester — Engineering Textbook, ₹150 |
| `arjun@example.com` | Requester — Laptop Charger, ₹100 |
| `admin@carrymate.app` | Admin dashboard |

> **Note on the in-memory DB:** it resets every time the backend restarts.
> For anything beyond a quick demo, set `MONGODB_URI` (see below).

### Running against a real database

```bash
docker compose up -d          # starts MongoDB on localhost:27017
```
In `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/carrymate
USE_IN_MEMORY_DB=false
```
Then seed it once:
```bash
cd backend && npm run seed
```

### Running tests
```bash
cd backend && npm test
```

## 6. Environment variables

See `backend/.env.example` and `frontend/.env.example` — every variable is
documented inline with what happens when it's left blank. Never commit real
`.env` / `.env.local` files.

## 7. Firebase setup

1. Create a project at console.firebase.google.com.
2. Enable **Authentication** → Email/Password and Google sign-in providers.
   (Phone auth can be enabled the same way; the backend's token verification
   path already supports whatever provider issued the Firebase ID token.)
3. Enable **Storage** if you want uploaded images to persist beyond a demo.
4. **Backend:** Project Settings → Service Accounts → Generate new private
   key. Populate `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes in the private key as
   downloaded — the backend un-escapes them automatically) and
   `FIREBASE_STORAGE_BUCKET` in `backend/.env`.
5. **Frontend:** Project Settings → General → Your apps → Web app.
   Populate the `NEXT_PUBLIC_FIREBASE_*` variables in `frontend/.env.local`.
6. Restart both servers. `/api/health` should report `"auth": "firebase"`.

Leaving all of this blank is fully supported — see the demo-mode table above.

## 8. MongoDB setup

**Atlas (recommended for anything beyond local dev):**
1. Create a free cluster at mongodb.com/atlas.
2. Create a database user and allow your IP (or `0.0.0.0/0` for quick testing).
3. Copy the connection string into `MONGODB_URI` in `backend/.env`.

**Local:** `docker compose up -d` from the repo root, or run any local
`mongod`, and point `MONGODB_URI` at it.

**Indexes:** all indexes (including `2dsphere` geospatial indexes on trip and
request coordinates) are declared on the Mongoose schemas and created
automatically on connect (`autoIndex: true`) — no manual index setup needed
for development. Disable `autoIndex` in production and manage indexes
explicitly once your dataset is large.

## 9. Razorpay setup

1. Create an account at razorpay.com and grab your **Key ID** and **Key
   Secret** from Settings → API Keys (use Test Mode keys while developing).
2. Backend: set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
3. Frontend: set `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `frontend/.env.local` (the
   publishable key id is safe to expose client-side; the secret never is).
4. Restart the backend. `/api/health` should report `"payments": "razorpay"`,
   and the delivery detail page will load the real Razorpay Checkout widget
   instead of the demo payment path.

**Important:** this integration creates real orders and verifies real
signatures — it does **not** implement custodial escrow. Funds settle
according to whatever payout/settlement configuration you set up on your
Razorpay account; CarryMate's `Transaction.status = SETTLED` marks that the
platform considers the delivery paid-and-confirmed, which is a bookkeeping
state, not a claim about where the money physically sits.

## 10. Map provider setup

Pick one:

- **Mapbox:** create a token at account.mapbox.com and set
  `NEXT_PUBLIC_MAPBOX_TOKEN`.
- **Google Maps:** enable the Geocoding API in Google Cloud Console and set
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

Both are frontend-only (`lib/geocoding.ts` calls the provider directly from
the browser). Leave both blank to use the built-in static city list, which
covers every route used in the seed data.

## 11. Development commands

| Command | Where | Does |
|---|---|---|
| `npm run dev` | backend | Start API with hot reload |
| `npm run build` / `npm start` | backend | Compile to `dist/` and run |
| `npm run seed` | backend | Seed demo data (against `MONGODB_URI`) |
| `npm test` | backend | Run Jest unit tests |
| `npm run dev` | frontend | Start Next.js dev server |
| `npm run build` / `npm start` | frontend | Production build and serve |
| `npm run lint` | frontend | ESLint |

## 12. Testing

`backend/src/__tests__/` covers the logic that matters most to correctness
and is independent of any database connection:

- `matchingService.test.ts` — the weighted scoring algorithm, including the
  "nearby city" geospatial matching behavior
- `geo.test.ts` — haversine distance and route-compatibility scoring,
  including a directionality regression test (a route in the *opposite*
  direction must not score well just because it shares an endpoint)
- `deliveryStateMachine.test.ts` — every valid transition in the state
  machine, and that invalid/terminal transitions are rejected
- `paymentService.test.ts` — signature verification accepts valid signatures
  and rejects tampered/replayed ones
- `itemSafetyService.test.ts` — prohibited-item screening, including that it
  can't be bypassed by hiding a banned term in the description only

Run with `npm test`. Controller/route-level integration tests would need a
running MongoDB instance (see Section 8) and are a natural next addition —
the service layer is already structured (thin controllers, logic in
`services/`) specifically to make that straightforward.

## 13. Deployment

**Frontend → Vercel**
1. Import the `frontend/` directory as the project root.
2. Set the `NEXT_PUBLIC_*` environment variables from `frontend/.env.example`.
3. Deploy. Vercel auto-detects Next.js.

**Backend → Railway / Render**
1. Point the service at the `backend/` directory.
2. Build command: `npm install && npm run build`. Start command: `npm start`.
3. Set all variables from `backend/.env.example`, at minimum `MONGODB_URI`
   and `JWT_SECRET` (generate a long random value — never reuse the example).
4. Set `CLIENT_ORIGIN` to your deployed frontend URL (required for CORS).
5. Set `USE_IN_MEMORY_DB=false` — the in-memory fallback is for local/demo
   use only and will lose all data on every deploy/restart.

**Database → MongoDB Atlas** (see Section 8)

**Auth/Storage → Firebase** (see Section 7)

## 14. API overview

All endpoints are under `/api`. Every response is `{ success, data|message,
code? }`. Auth via `Authorization: Bearer <token>` (Firebase ID token or demo
JWT, depending on mode).

```
POST   /api/auth/register            POST   /api/auth/login          (demo mode only)
POST   /api/auth/profile             PUT    /api/auth/profile

GET    /api/users/:id                GET    /api/users/:id/ratings

POST   /api/trips                    GET    /api/trips
GET    /api/trips/:id                PUT    /api/trips/:id            DELETE /api/trips/:id

POST   /api/requests                 GET    /api/requests
GET    /api/requests/:id             PUT    /api/requests/:id         DELETE /api/requests/:id
POST   /api/requests/:requestId/select-traveler

GET    /api/matches/trip/:tripId
GET    /api/matches/request/:requestId

GET    /api/deliveries               GET    /api/deliveries/:id
POST   /api/deliveries/:id/accept    POST   /api/deliveries/:id/cancel
POST   /api/deliveries/:id/pickup/generate-otp     POST /api/deliveries/:id/pickup/verify
POST   /api/deliveries/:id/delivery/generate-otp   POST /api/deliveries/:id/delivery/verify
POST   /api/deliveries/:id/confirm

POST   /api/payments/create-order    POST   /api/payments/verify
GET    /api/payments/my-transactions

GET    /api/conversations            GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages

POST   /api/ratings

POST   /api/verification             GET    /api/verification/status

POST   /api/reports                  POST   /api/disputes

GET    /api/notifications            POST   /api/notifications/:id/read

POST   /api/uploads/image

GET    /api/admin/analytics          GET    /api/admin/users          POST /api/admin/users/:id/suspend
GET    /api/admin/trips              GET    /api/admin/requests       GET  /api/admin/transactions
GET    /api/admin/verifications      POST   /api/admin/verifications/:id/review
GET    /api/admin/reports            POST   /api/admin/reports/:id/resolve
GET    /api/admin/settings           PUT    /api/admin/settings

GET    /api/health                   — reports which mode each subsystem is running in
```

## 15. Security considerations

- **Nothing from the client is trusted for authorization.** Every ownership
  check (`trip.travelerId.equals(req.user._id)`, delivery participant checks,
  etc.) happens server-side against the token-derived identity, never a
  client-supplied user id.
- **Every delivery state transition is validated against an explicit
  transition table** (`services/deliveryStateMachine.ts`) — there is no code
  path that sets `delivery.state` without going through `assertTransition`.
- **OTPs are hashed at rest** (bcrypt), expire after 15 minutes, and are
  rate-limited to 5 attempts. They are never returned by any `GET` endpoint —
  only the immediate generate-call response includes the plaintext code.
- **Payment signatures are verified server-side** using the same
  HMAC-SHA256(orderId|paymentId) scheme Razorpay specifies; the demo-mode
  path is symmetric so no separate insecure code path exists.
- **Duplicate-prevention** is enforced at the database layer, not just in
  application logic: a unique index on `(deliveryRequestId, reviewerId)`
  blocks duplicate ratings; a unique index on `(tripId, requestId)` prevents
  duplicate match records; transactions are checked for existing `PAID`/
  `SETTLED` status before allowing a new payment attempt.
- **Prohibited items are screened server-side** on both name and description
  fields, on both create and update — this cannot be bypassed from the
  frontend.
- **Standard hardening:** Helmet security headers, CORS locked to
  `CLIENT_ORIGIN`, `express-mongo-sanitize` against NoSQL injection, rate
  limiting on all `/api` routes, Zod validation on every mutating endpoint,
  Multer file-upload limits (5MB, JPEG/PNG/WEBP only), and a global error
  handler that never leaks stack traces to the client.
- **Passwords** (demo-auth mode only) are hashed with bcrypt and never
  returned in any API response (`select: false` on the schema field, plus a
  `toJSON` transform as a second line of defense).

### Known gaps / explicitly out of scope for this MVP
- No refresh-token rotation for demo-mode JWTs (long-lived 7-day tokens) —
  fine for a demo, not for production; would move to short-lived access
  tokens + refresh tokens.
- No server-side EXIF stripping on uploaded images.
- No automated abuse/fraud detection on ratings or messages.
- Rate limiting is a single global limiter, not tuned per-endpoint (e.g.
  login attempts should probably be stricter than read endpoints).

## 16. Future roadmap

Architecture is intentionally left extensible for, but does not implement:

- AI-assisted route recommendations and dynamic reward suggestions
- Fraud/anomaly detection on the matching and payment layers
- Demand and route-popularity prediction
- Smart/dynamic pricing suggestions for requesters
- A wallet system for traveler earnings (currently: earnings are recorded on
  `Transaction`/`User.completedDeliveries`, with actual payout left to
  Razorpay's settlement configuration)
- Referral and loyalty programs
- Multi-language support
- WhatsApp and push notification channels (the `Notification` model and
  `notificationService` are already structured so a delivery channel can be
  added without touching call sites)
- Advanced multi-leg/relay routing (today's matching engine handles single-leg
  point-to-point routes)

---

## A note on how this was verified

This project was built and checked as far as the development environment
allowed:

- The backend compiles clean under `tsc --strict` and passes 28 unit tests
  covering the matching engine, geospatial route scoring, the delivery state
  machine, and payment signature verification — including two real bugs
  (a route-matching directionality flaw and a delivery-cancellation
  capacity-release bug) that were caught and fixed during this process.
- The full 25-step acceptance scenario (register → trip/request → match →
  select → accept → pay → pickup OTP → transit → delivery OTP → confirm →
  rate → admin visibility → authorization checks) was traced step-by-step
  against the actual controller code.
- The frontend builds clean (`next build`) and lints clean (`eslint`) across
  all 15 routes.

What could **not** be verified in the sandbox this was built in: a live,
running end-to-end click-through against a real MongoDB instance, because
that sandbox's network cannot reach MongoDB's binary download servers (needed
by `mongodb-memory-server`) or install a local `mongod`. This is a
sandbox-networking limitation, not a code path that was skipped — on any
machine with normal internet access (or using `docker compose up`), the
Quick Start above should work immediately. If something doesn't, please
open an issue with the output of `/api/health` and the relevant server log.
