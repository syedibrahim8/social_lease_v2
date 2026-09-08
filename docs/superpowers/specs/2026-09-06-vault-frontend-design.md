# Vault — second frontend for the Creator Asset Marketplace

**Date:** 2026-09-06
**Status:** Approved design, ready for implementation planning
**Supersedes:** nothing. `web/` is untouched by this work.

---

## 1. Goal & constraints

Build a second, independent frontend — `vault/` — that carries the money spine of the
Creator Asset Marketplace end to end against the **real** backend, and looks like a
private bank rather than a SaaS dashboard.

The existing `web/` app is a complete, well-built design exercise, but it is
mock-first: seven of its ten endpoint modules route through `resolve()`, which
discards the live call and always returns fixture data. Its Stripe integration
reaches the backend for Connect onboarding only. Nothing in it calls checkout,
release, refund, the submissions writes, or the SSE stream.

`vault/` inverts that: **live-only, no fallback.** Every screen shows what the
backend actually holds, including nothing.

### Locked decisions

| Decision        | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Location        | `vault/` at repo root, sibling of `web/`                                           |
| `web/`          | **Untouched.** Not modified, not deleted. Retirement is a later, separate decision |
| Scope           | The money spine (§3). ADMIN console, AI services and deep analytics are slice 2    |
| Data            | Live-only against `/api/v1`. No mock module, no silent fallback                    |
| Art direction   | **Vault** — ink + deep emerald, rationed gold, serif money, mono figures           |
| Backend changes | Three surgical fixes only (§8)                                                     |
| Dev port        | `3001`                                                                             |

### Non-negotiable rules

1. **No mock fallback, ever.** An empty collection renders an empty state. A failed
   request renders an error state with a retry. `web/`'s `liveFirst` falls back to
   fixtures when a result is merely an empty array; for a money surface that is
   disqualifying — a creator with no earnings must see `$0.00`, never a fixture's
   `$48,250`.
2. **Money is integer minor units everywhere**, formatted only at the render edge,
   exactly as the backend models it. No floats in application state.
3. **Gold is rationed.** It marks money and the single primary action per screen.
4. **Every mutation is optimistic-free.** Money actions wait for the server and show
   the server's result. Optimistic UI is for likes, not payouts.

---

## 2. Architecture

### Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 (CSS-token
config) · Motion · Lenis · TanStack Query v5 · react-hook-form + Zod · sonner ·
lucide-react. Own `package.json` and lockfile; pnpm only.

Deliberately **not** shared with `web/`: no pnpm workspace, no extracted package.
`web/` stays byte-for-byte identical. The cost is that backend contract types exist
in two places; that is accepted, and is confined to type declarations mirroring a
backend this repo controls.

### Folder structure

```
vault/
  app/
    (marketing)/            landing
    (auth)/                 login · register · verify-email · forgot · reset
    (app)/                  authenticated shell
      dashboard/
      marketplace/          browse + [id] detail
      negotiations/         list + [id] offer thread
      contracts/            list + [id] detail (delivery + review + money actions)
      payments/
        success/            ← Stripe success_url (does not exist today)
        cancel/             ← Stripe cancel_url (does not exist today)
        onboard/refresh|return/
      wallet/
      notifications/
      settings/
  components/
    ui/                     primitives (button, card, dialog, table, …)
    money/                  Amount, BalanceCard, EscrowTracker, LedgerTable
    motion/                 Reveal, CountUp, SheenButton, PayoutRelease
    marketing/  auth/  marketplace/  negotiation/  contract/  wallet/
  lib/
    api/
      client.ts             typed fetch + 401→refresh→retry
      stream.ts             SSE over fetch (see §6)
      endpoints/*.ts        one module per backend router
      types.ts              backend contract types
    money.ts                minor-unit formatting, currency
    motion.ts               springs, easings, reduced-motion
    query.ts                query keys + invalidation map
  styles/globals.css        Vault tokens
```

### Dependency direction

`app/` → `components/` → `lib/`. Components never call `fetch` directly; every
network call goes through `lib/api/endpoints/*`. Endpoint modules never import
React.

---

## 3. Scope — the money spine

### In scope

| Flow          | Screens                                                   | Backend                                                       |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Public        | Landing                                                   | —                                                             |
| Auth          | login, register, verify-email, forgot, reset              | `/auth/*`                                                     |
| Discovery     | marketplace browse, campaign detail, asset detail         | `/campaigns`, `/assets`                                       |
| Negotiation   | list, offer thread, apply, counter/accept/reject/withdraw | `/applications/*`                                             |
| Contract      | list, detail, deliverables                                | `/contracts/*`                                                |
| **Funding**   | **checkout → Stripe → success / cancel**                  | `/payments/contracts/:id/checkout`                            |
| Delivery      | proof upload, submit, brand review                        | `/submissions/*`                                              |
| **Payout**    | **release, refund**                                       | `/payments/contracts/:id/{release,refund}`                    |
| Wallet        | balances, escrow tracker, ledger, Connect onboarding      | `/payments/*`                                                 |
| Notifications | list, unread badge, **live SSE**                          | `/notifications/*`                                            |
| Settings      | profile, security, payouts, notification prefs            | `/creators`, `/brands`, `/auth`, `/notifications/preferences` |

Roles: **CREATOR** and **BRAND**.

### Out of scope (slice 2)

ADMIN console · verification review queue · AI services (`/ai/*`) · deep analytics
charts · asset availability calendar editing · file uploads (proof `files[]` stays
URL-based until a Cloudinary slice lands).

### Gaps this closes

Every one of these is broken or absent in `web/` today:

1. Brand can fund a contract — real Stripe Checkout redirect.
2. `/payments/success` and `/payments/cancel` exist. Stripe already redirects there;
   today it is a 404.
3. Brand can release a payout and issue a refund.
4. Creator can create, update and submit a delivery; brand can approve, reject or
   request revision.
5. Notifications render, and stream live.
6. Every screen reads live data.

---

## 4. Design system

### Method & tooling (binding)

The design is not to be improvised at the keyboard. Each of these is loaded at the
point of work, and the plan's tasks name which applies:

| Concern                       | Source                                       | Applied to                                                                                                                                                            |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design-system architecture    | `ui-ux-pro-max` skill                        | Token layering, type scale, spacing rhythm, component API shape, chart and table specs, accessibility rules                                                           |
| Anti-generic visual direction | `design-taste-frontend` skill                | Audit-first pass on every screen; reject template-shaped layouts, default shadows, stock hero patterns. Vault must not read as "AI-generated dashboard"               |
| Motion & micro-interaction    | `emil-design-eng` principles                 | Every animation in §5 — easing choice, duration, interruption behaviour, what earns motion and what does not                                                          |
| Component sourcing            | **21st.dev** MCP (`search`, `get_component`) | Find and adapt existing high-quality primitives before hand-rolling. Anything adopted is restyled to Vault tokens — never dropped in as-is                            |
| Framework accuracy            | **context7** MCP                             | Tailwind v4 and Next.js 16 APIs verified against current docs, not recalled. Next 16 in particular differs from training data (`web/AGENTS.md` warns of exactly this) |

Rule of precedence when they disagree: correctness (context7) > design-system
coherence (ui-ux-pro-max) > visual distinctiveness (design-taste-frontend) > motion
polish (emil). Motion never buys its way past a legibility or accessibility loss.

### Tokens

```
ink        #080B0A     surface   #101917     gold      #C9A227
ink-2      #0A0F0D     surface-2 #14201D     gold-lo   #D9B84A
emerald    #123028     line      rgba(201,162,39,.16)  gold-hi  #F0D67A
emerald-lo #0E211C     line-2    rgba(237,233,223,.09)
bone       #EDE9DF     bone-2    #B9C0BB     muted     #7E8A84   muted-2 #5C6762
positive   #4ADE80     negative  #F87171     warning   #E0A33E   info    #6BA8C9
```

Radii `sm 6 · md 8 · lg 10 · xl 13 · 2xl 16`. Elevation is border-and-glow, never
drop shadow on dark: `0 6px 20px rgba(201,162,39,.28)` for gold actions only.

Dark is the **only** theme. This is a deliberate single-commitment design; there is
no light mode and no theme toggle. Tokens are still declared on `:root` so a light
theme could be added later without restructuring.

### Type — three voices, never mixed in one context

| Voice                       | Face                           | Used for                                       |
| --------------------------- | ------------------------------ | ---------------------------------------------- |
| Display / money-you-feel    | Playfair Display               | Hero amounts, page titles, marketing headlines |
| Figures / money-you-compare | JetBrains Mono, `tabular-nums` | Every number in a table, row, stat or badge    |
| Interface                   | Inter                          | Body, labels, navigation, forms                |

The rule that keeps Vault legible: a balance card gets the serif; a ledger row gets
the mono. One amount, two jobs, two faces.

### Components

`ui/` primitives are written for this app, not lifted from `web/`: Button (gold /
ghost / quiet / danger), Card, Dialog, Sheet, Table, Input, Select, Textarea, Badge,
Tabs, Tooltip, Skeleton, EmptyState, ErrorState.

`money/` is the layer that makes this app what it is:

- **`<Amount>`** — takes minor units + currency, renders `serif` or `mono` variant,
  optional sign colouring, always `tabular-nums`.
- **`<BalanceCard>`** — the hero balance with radial gold bloom.
- **`<EscrowTracker>`** — the contract state machine as four steps
  (`FUNDED → SUBMITTED → APPROVED → COMPLETED`), current step pulsing gold, driven by
  live contract status.
- **`<LedgerTable>`** — transaction rows, mono figures, signed colour, type badge.

---

## 5. Motion

Lenis for smooth scroll (`lerp 0.09`), disabled entirely under
`prefers-reduced-motion`. Motion for everything else.

| Moment             | Treatment                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing scroll     | Section reveals on scroll progress; hero grid parallax drift                                                                                 |
| Money on mount     | Count-up from zero, ~900ms, `easeOutExpo`, mono digits so width never jitters                                                                |
| Gold buttons       | Sheen sweep once per ~3.4s                                                                                                                   |
| Offer thread       | Shared-layout transitions as offers are countered                                                                                            |
| Escrow step change | Step advances with a pulse; the tracker line fills                                                                                           |
| **Payout release** | The set-piece: escrow amount drains and the available balance counts up to absorb it, gold particles settle, then a single confirmation line |
| Route change       | 180ms cross-fade, no slide                                                                                                                   |

Every animation respects `prefers-reduced-motion`: reveals become instant, count-up
becomes a static value, the payout set-piece becomes a state change with a toast.

---

## 6. Data layer

### Client

`lib/api/client.ts` — typed `fetch` over the backend's two envelopes
(`{success,message,data,meta?}` / `{success,message,errors[]}`), `credentials:
"include"` so the refresh cookie rides along, access token injected per request from
memory, and a single 401 → refresh → retry. `ApiError` carries `status` and the
normalized `errors[]` so forms can map field errors from the 422 envelope.

### Auth

Access token in memory only (never `localStorage`). Refresh token is the backend's
`httpOnly` cookie, scoped to `${API_PREFIX}/auth`. On mount, the provider calls
`/auth/refresh`; success hydrates the session, failure renders the app logged out.

`localhost:3001 → localhost:8080` is cross-**origin** but same-**site**, so the
`sameSite: 'lax'` dev cookie is sent normally. No backend cookie change needed.

### SSE — why `EventSource` cannot be used

`GET /notifications/stream` is behind `authenticate`, which reads **only** the
`Authorization: Bearer` header (`src/middleware/authenticate.middleware.ts:19`). The
browser's native `EventSource` cannot set request headers. This is almost certainly
why `web/` never wired the stream despite the backend being complete.

**Solution, frontend-only:** consume the stream with `fetch()` carrying the
`Authorization` header, then read `response.body` as a `ReadableStream`, decode with
`TextDecoderStream`, and parse `event:` / `data:` frames manually
(`lib/api/stream.ts`). Reconnect with exponential backoff, cap at 30s, abort on
logout. No backend change required.

On a notification event: push a toast, bump the unread badge, and invalidate the
query keys the event implicates (`payment.received` → wallet + contract;
`submission.approved` → contract + wallet).

### Query & invalidation

Query keys are centralised in `lib/query.ts`, one factory per resource. Every
mutation declares the keys it invalidates in the same file, so the fan-out of, say,
"release payout" (payment, wallet, transactions, contract, campaign) is written once
and reviewable in one place.

### States

Every data surface implements four states explicitly: **pending** (skeleton in the
component's own shape, never a spinner), **error** (message from the envelope +
retry), **empty** (an illustrated, role-aware prompt — "No contracts yet. Fund one
from a negotiation."), and **loaded**. Empty is a designed state, not an accident.

---

## 7. The Stripe flow — the centrepiece

This is the flow that does not exist in any form today.

### Brand funds a contract

1. Contract detail, status `PENDING_FUNDING`. A gold **Fund escrow** button shows the
   agreed price, the 10% platform commission, and the creator's net — computed from
   the backend's own split so the brand sees exactly what the creator receives.
2. Confirm dialog states plainly: _funds are held by the platform and released only
   when you approve the delivery._
3. `POST /payments/contracts/:id/checkout` → `window.location.href = checkoutUrl`.
4. Stripe hosted Checkout.
5. → `/payments/success?contractId=…`. **This page currently 404s.**

### The success page — designed around a race

The webhook that flips the payment to `PAID` may not have landed when Stripe
redirects the browser back. The page must not lie in either direction.

It polls **`GET /contracts/:id`** every 1.5s for up to 20s, watching for
`PENDING_FUNDING → FUNDED`. Note `GET /payments` accepts only `page`/`limit`/`status`
(`listPaymentsQuerySchema`) — there is **no `contractId` filter**, so the contract is
the correct thing to poll, and it needs no backend change.

- **Confirmed** → the payout set-piece in reverse: gold flows _into_ escrow, the
  tracker advances to `FUNDED`, and a receipt shows amount, commission, creator net.
- **Still pending after 20s** → an honest holding state: _"Stripe has your payment.
  We're waiting on confirmation — this page updates itself, and you'll get a
  notification."_ Never a false success.

`/payments/cancel` is a calm off-ramp back to the contract, with escrow unfunded and
nothing charged.

### Creator delivers

Proof form: typed `files[]` (`SCREENSHOT` / `ANALYTICS_SCREENSHOT` / `DOCUMENT` +
url + caption), `links[]`, `note`, optional `analytics{}`. Draft saves via
`PATCH /submissions/:id`; **submit is gated client-side on ≥1 file or link**, mirroring
the server rule so the user never eats a 422 they could have been warned about.

### Brand reviews

Approve / request revision / reject. **Approve is the money action** — gold, with a
dialog that states the payout amount and that it is irreversible. On success the
backend auto-releases; the UI runs the payout set-piece and advances the tracker to
`COMPLETED`.

If the backend reports the payout was deferred (creator not payout-onboarded), the
contract shows `APPROVED · payout pending creator onboarding` with a **Release
payout** action for later. This is a real backend state that no UI has ever surfaced.

### Refund

Shown when the payment is `PAID` and the contract is **not** `APPROVED` — i.e. across
`FUNDED`, `IN_PROGRESS` and `SUBMITTED`. This matches the backend exactly once §8.1
lands, so the UI never offers an action the server will reject, and never hides one it
would allow. Destructive styling, typed confirmation, states that the contract will be
cancelled.

---

## 8. Backend changes — surgical, three only

Each follows existing module conventions, is verified against real Atlas with a
throwaway `scripts/verify-*.ts` that cleans up after itself, and touches nothing else.

### 8.1 Refund guard

`paymentService.refundPayment` checks only `payment.status === 'PAID'`. It never
checks contract status. A contract whose delivery was approved but whose payout was
deferred (creator not yet onboarded) sits `APPROVED` with the payment still `PAID` —
so a brand can refund work that was already accepted.

Add, alongside the existing guards:

```ts
if (contract.status === 'APPROVED') {
  throw ApiError.conflict('This delivery was approved; the payout must be released, not refunded');
}
```

### 8.2 Brand-side ledger

Every `Transaction` is written with `userId: payment.creatorId`, and
`GET /payments/transactions` is `authorize('CREATOR')`. Brands have no transaction
history at all, so a brand wallet has nothing real to render.

- Write a mirrored brand entry in `handleCheckoutCompleted` and `refundPayment`, using
  **gross** `payment.amount` (what the brand actually paid, commission included — not
  `creatorAmount`):
  - fund → `{ userId: brandId, type: 'SPEND', amount: -payment.amount }`
  - refund → `{ userId: brandId, type: 'REFUND', amount: +payment.amount }`

  The existing creator rows are unchanged and stay on `creatorAmount`; the two sides of
  the ledger legitimately differ by the commission.

- Add `SPEND` to `TRANSACTION_TYPES`.
- Open `GET /payments/transactions` to `CREATOR` and `BRAND` — it already filters by
  `userId`, so it is correctly scoped for both.

### 8.3 Environment

`.env` must point Stripe redirects and CORS at the new app:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
WEB_APP_URL=http://localhost:3001
```

`WEB_APP_URL` drives Stripe `success_url` / `cancel_url` / Connect return **and**
password-reset and verification email links. Pointing it at `3001` moves those to
`vault/`; `web/`'s Connect return would then land on `vault/`. Reverting is one line.
Flagged explicitly because it is the only change here that alters `web/`'s behaviour
— by redirection, not by modification.

---

## 9. Verification

Matching the repo's established practice: no test framework, real round-trips,
evidence over assertions.

1. `pnpm typecheck && pnpm lint && pnpm build` green in `vault/`, and unchanged in
   the backend after §8.
2. `scripts/verify-vault-backend.ts` — drives the three backend changes against real
   Atlas: refund-after-approval is rejected; a brand fund writes a `SPEND` row; a
   brand can read `/payments/transactions`. Cleans up in `finally`.
3. End-to-end against real Stripe test mode with `pnpm seed:demo` data: register →
   onboard → apply → negotiate → accept → fund via Checkout (test card
   `4242 4242 4242 4242`) → webhook lands → success page confirms → submit proof →
   approve → payout state → ledger reflects both sides.
4. SSE: trigger a real domain event, confirm the toast and badge update without a
   refresh.
5. Reduced-motion pass with the OS setting on.

Playwright screenshots are not part of the gate — per standing preference, layers are
verified with typecheck / lint / build plus a real round-trip.

---

## 10. Risks

| Risk                                                 | Mitigation                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Stripe webhook lags the browser redirect             | The success page polls and shows an honest pending state; never a false success                       |
| Payout `Transfer` has never executed in this repo    | Onboard a real Stripe test Express account during verification so the release path runs at least once |
| Two copies of backend contract types drift           | Types live in one file per app; §8 is the only backend change in this slice                           |
| `WEB_APP_URL` flip changes `web/`'s redirect targets | Documented in §8.3; one-line revert                                                                   |
| Scope creep into admin / AI / analytics              | Explicitly slice 2 (§3)                                                                               |

---

## 11. Out of scope

- Deleting or modifying `web/`.
- Light theme.
- File uploads (proof stays URL-based until a Cloudinary slice).
- Replacing the in-process event bus, SSE hub or rate-limiter store with Redis.
- Any backend change beyond §8.
