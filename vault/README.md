# Vault

The second frontend for this repo. `web/` is the first one and is untouched by
this work; the two are independent apps that talk to the same Express API.

|                | `web/`                                  | `vault/`                                       |
| -------------- | --------------------------------------- | ---------------------------------------------- |
| Port           | 3000                                     | 3001                                           |
| Data           | Mock adapter with fixtures               | Live `/api/v1` only. No mock mode, no fixtures |
| Scope          | Broad, screen-first                      | The money spine, end to end                    |
| Theme          | Light and dark                           | Dark only, by commitment                       |

The scope is deliberate: landing, auth, marketplace, negotiation, contract,
real Stripe checkout, delivery, approval, payout, wallet, notifications with a
live stream, and settings. Admin, the AI services and the deep analytics pages
belong to a later slice and are not stubbed here.

There are no fixtures anywhere. An account with no data renders a designed
empty state on every screen, which is checked as part of the release sweep.

## Running it

Two processes. The API first, from the repo root:

```bash
pnpm install
pnpm dev            # Express on :8080
```

Then this app, in a second terminal:

```bash
cd vault
pnpm install
cp .env.example .env.local
pnpm dev            # Next.js on :3001
```

`web/` still runs on :3000 with its own `pnpm dev`, and the two frontends can
be up at the same time.

### Environment

`vault/.env.local`:

| Variable                       | Value                            |
| ------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `http://localhost:8080/api/v1`   |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional. Blank disables Google  |

The backend must allow this origin and know where to send people back to:

| Variable       | Value                                          |
| -------------- | ---------------------------------------------- |
| `CORS_ORIGINS` | must include `http://localhost:3001`           |
| `WEB_APP_URL`  | `http://localhost:3001`, used by Stripe returns |

For the payment path the backend also needs `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`. Without them the payment endpoints answer 501 and the
UI says so rather than pretending.

Webhooks in development:

```bash
stripe listen --forward-to localhost:8080/api/v1/payments/webhook
```

Escrow uses separate charges and transfers, so a payout needs an available
balance on the platform account. Approving and releasing on the same day can
fail with `balance_insufficient` until the test balance is topped up.

## Data to look at

From the repo root:

```bash
pnpm seed:demo      # demo users, campaigns and assets. Password: Demo1234!
pnpm unseed:demo    # remove them again
```

The demo accounts are `maya@demo.creatormarket.dev` (creator) and
`northwind@demo.creatormarket.dev` (brand). `scripts/seed-negotiation.ts`
adds an accepted application and the contract it generates, which is the
quickest way to reach the funding screen.

## Checks

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

The root `pnpm lint` and `pnpm format` ignore `vault/`, which has its own flat
ESLint config and Prettier settings.

## How it is put together

```
app/
  (marketing)/   landing
  (auth)/        login, register, verify-email, forgot, reset
  (app)/         the authenticated shell
  style/         the design system, rendered, with measured contrast ratios
components/
  ui/            primitives written for this app
  money/         Amount, BalanceCard, EscrowTracker, LedgerTable
  marketing/ contract/ negotiation/ marketplace/ wallet/ settings/
  motion/        Reveal, CountUp, CountNumber, PayoutRelease, SmoothScroll
lib/
  api/           client, typed contracts, endpoints, the SSE stream
  auth/          the one session provider
  query.ts       every query key, and what each domain action invalidates
```

Three rules worth knowing before editing:

**Money is minor units, everywhere.** `<Amount minor={400000} />` is $4,000.00.
Passing dollars produces a figure a hundred times too small, which is why the
prop is named `minor`.

**Reads come back populated.** The API populates `campaignId`, `creatorId`,
`brandId` and `contractId` into objects on read and takes ids on write. Compare
them with `refId()` from `lib/api/types.ts`, never with `===`. Three separate
bugs came from forgetting this.

**Do not branch a render on `useReducedMotion()`.** The server cannot know the
setting, so a branch there renders one tree on the server and another on the
client. Render one tree and resolve the motion in an effect, the way `Reveal`
and `CountUp` do.

`styles/globals.css` carries the design tokens and a measured contrast table.
`--color-faint` fails AA on every surface and is not a text colour;
`grep -rn text-faint --include=*.tsx` should only ever find the two non-text
graphics it is allowed on.
