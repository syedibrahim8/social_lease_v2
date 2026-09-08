# Vault Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `vault/` — a second, live-only Next.js frontend carrying the Creator Asset Marketplace money spine end to end (browse → negotiate → contract → fund via Stripe → deliver → approve → payout → wallet), in the Vault art direction, plus three surgical backend fixes it depends on.

**Architecture:** A standalone Next.js 16 App Router app at `vault/`, sibling to the untouched `web/`. Own `package.json`/lockfile, own design system, own API client. Data flows one way: `app/` → `components/` → `lib/api/endpoints/*` → the real `/api/v1` backend. No mock module exists in this app; empty means empty. Three backend changes (refund guard, brand ledger, env) land first because frontend tasks depend on them.

**Tech Stack:** Next.js 16.2.9 · React 19.2.4 · TypeScript strict · Tailwind v4 (CSS-first `@theme`) · Motion · Lenis · TanStack Query v5 · react-hook-form + Zod · sonner · lucide-react · pnpm.

**Spec:** `docs/superpowers/specs/2026-09-06-vault-frontend-design.md` — read it before Task 1. Every task below argues from a numbered section of it.

---

## Global Constraints

Every task's requirements implicitly include this section.

**Verification model — read this first.** This repo has **no test framework** and none is being added (`CLAUDE.md`, and the user's standing preference: verify with typecheck/lint/build plus a real round-trip; don't belabour Playwright). The TDD cycle is therefore adapted, not skipped:

- **Backend tasks:** the failing test is a real assertion in `scripts/verify-vault-backend.ts`, run with `pnpm tsx` against the real Atlas DB. Write the assertion, watch it fail, implement, watch it pass. Test data is namespaced `vault-test-*@test.local` and deleted in a `finally` block.
- **Frontend tasks:** the gate is `pnpm typecheck && pnpm lint && pnpm build` green in `vault/`, plus the task's stated **manual round-trip** performed against the running backend. A task is not done until its round-trip has actually been run and its output reported.
- Never claim a check passed without pasting what it printed.

**Hard rules:**

- `pnpm` only. Never npm/yarn. `vault/` has its own lockfile.
- **`web/` is never modified.** Not one file. If a task seems to need it, stop and ask.
- Money is **integer minor units** in all state; format only at render.
- **No mock data, no fixtures, no fallback.** An empty list renders an empty state.
- **No optimistic updates on money mutations.** Wait for the server, render the server's answer.
- Gold (`--color-gold`) marks money and exactly one primary action per screen.
- Dark theme only. No theme toggle.
- Every animation respects `prefers-reduced-motion`.
- Backend changes are limited to spec §8. Three files plus `.env`. No refactors.
- Path alias `@/*` → `vault/*`.
- Conventional commits (`feat:`, `fix:`, `chore:`). Commit at the end of every task.

**Design method (spec §4, binding).** Load at point of work, not upfront:

| Load this                                    | Before doing this                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ui-ux-pro-max`                              | Tasks 5, 6, 7 — tokens, type scale, component APIs                                        |
| `design-taste-frontend`                      | Tasks 5, 13, 24 — and as an audit pass on every screen                                    |
| `emil-design-eng`                            | Task 8, and any task adding motion                                                        |
| **21st.dev** MCP (`search`, `get_component`) | Tasks 6, 7, 21 — source before hand-rolling; restyle to Vault tokens, never drop in as-is |
| **context7** MCP                             | Any task using a Next.js 16 or Tailwind v4 API you have not verified this session         |

Precedence when they conflict: correctness (context7) > system coherence (ui-ux-pro-max) > distinctiveness (design-taste-frontend) > motion polish (emil).

**Verified framework facts** (context7, this session — do not re-derive):

- Next.js 16: `params` and `searchParams` are **Promises**. Server components `await` them; client components read them with React's `use()`. Synchronous access was fully removed in v16.
- Route groups `(name)` organise without affecting the URL path.
- Tailwind v4: `@import "tailwindcss";` replaces `@tailwind` directives. Custom tokens go in `@theme { --color-*: … }`. PostCSS config is `{ plugins: ["@tailwindcss/postcss"] }`.

**Backend contract facts** (verified against `src/`, do not re-derive):

- Envelopes: success `{success,message,data,meta?}`, error `{success,message,errors[]}`.
- Access token in JSON body; refresh token is an httpOnly cookie scoped to `/api/v1/auth`.
- `:3001 → :8080` is cross-origin but **same-site**, so the dev `sameSite:'lax'` cookie is sent. No backend cookie change needed.
- `GET /notifications/stream` requires `Authorization: Bearer`. **`EventSource` cannot set headers** — the stream must be consumed via `fetch` + `ReadableStream` (Task 12).
- `GET /payments` accepts only `page`/`limit`/`status`. **There is no `contractId` filter** — poll `GET /contracts/:id` instead (Task 18).
- `transactionRepository.create` is called as `{ userId, paymentId, contractId, type, amount, currency, description }` — mirror existing call sites exactly.

---

# Phase 0 — Backend (spec §8)

These land first. Frontend tasks 18, 20 and 21 depend on them.

---

### Task 1: Refund guard

Spec §8.1. Today `refundPayment` checks only `payment.status === 'PAID'` and never looks at contract status, so a brand can refund a delivery that was already approved but whose payout was deferred.

**Files:**

- Modify: `src/modules/payments/payment.service.ts` (in `refundPayment`, after the ownership check)
- Create: `scripts/verify-vault-backend.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `scripts/verify-vault-backend.ts` exporting nothing; run directly. Later tasks append assertions to it.

- [ ] **Step 1: Write the failing assertion**

Create `scripts/verify-vault-backend.ts`. Follow the shape of `scripts/seed-demo.ts` for connect/disconnect. Namespace all emails `vault-test-*@test.local` and delete in `finally`.

```ts
/**
 * Verification for the three surgical backend changes behind the Vault frontend.
 *   pnpm tsx scripts/verify-vault-backend.ts
 * Creates namespaced test data and removes it in a finally block.
 */
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { paymentService } from '@/modules/payments/payment.service';
// …plus the models needed to seed a brand, creator, campaign, contract and payment.

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean): void {
  if (ok) {
    passed += 1;
    logger.info(`PASS ${name}`);
  } else {
    failed += 1;
    logger.error(`FAIL ${name}`);
  }
}

async function main(): Promise<void> {
  await connectDatabase();
  try {
    // Seed: brand user, creator user, campaign, contract (status APPROVED),
    // payment (status PAID) for that contract. Use the models directly.
    const { contract, brandId } = await seedApprovedContractWithPaidPayment();

    // 1 — refund must be rejected once the delivery is APPROVED.
    let rejected = false;
    try {
      await paymentService.refundPayment(contract._id.toString(), brandId);
    } catch (error) {
      rejected = error instanceof Error && /approved/i.test(error.message);
    }
    check('refund is rejected when the contract is APPROVED', rejected);
  } finally {
    await cleanup();
    await disconnectDatabase();
    logger.info(`verify-vault-backend: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }
}

main().catch((error: unknown) => {
  logger.error('verify-vault-backend crashed', {
    error: error instanceof Error ? error.message : error,
  });
  process.exitCode = 1;
});
```

Write `seedApprovedContractWithPaidPayment()` and `cleanup()` concretely in the same file — create the User/Campaign/Contract/Payment docs with the models, and in `cleanup` delete every document whose email matches `/vault-test-.*@test\.local$/` plus the campaign/contract/payment ids it created.

- [ ] **Step 2: Run it and watch the assertion fail**

```bash
pnpm tsx scripts/verify-vault-backend.ts
```

Expected: `FAIL refund is rejected when the contract is APPROVED` — because the guard does not exist yet, `refundPayment` succeeds and nothing throws.

- [ ] **Step 3: Add the guard**

In `src/modules/payments/payment.service.ts`, inside `refundPayment`, immediately after the `Only the contract owner can request a refund` check:

```ts
if (contract.status === 'APPROVED') {
  throw ApiError.conflict('This delivery was approved; the payout must be released, not refunded');
}
```

- [ ] **Step 4: Run it and watch it pass**

```bash
pnpm tsx scripts/verify-vault-backend.ts
```

Expected: `PASS refund is rejected when the contract is APPROVED`, `1 passed, 0 failed`.

- [ ] **Step 5: Confirm nothing else broke**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/modules/payments/payment.service.ts scripts/verify-vault-backend.ts
git commit -m "fix(payments): reject refunds on approved deliveries"
```

---

### Task 2: Brand-side ledger

Spec §8.2. Every `Transaction` is written with `userId: payment.creatorId`, and `GET /payments/transactions` is `authorize('CREATOR')`. Brands have no history, so a brand wallet has nothing real to render.

Brand rows use **gross** `payment.amount` (what the brand paid, commission included). Creator rows keep `creatorAmount`. The two sides legitimately differ by the commission.

**Files:**

- Modify: `src/modules/payments/payment.types.ts` (add `SPEND` to `TRANSACTION_TYPES`)
- Modify: `src/modules/payments/payment.service.ts` (`handleCheckoutCompleted`, `refundPayment`)
- Modify: `src/modules/payments/payment.routes.ts:29` (`/transactions` authorize)
- Modify: `scripts/verify-vault-backend.ts` (append assertions)

**Interfaces:**

- Consumes: `check()` from Task 1.
- Produces: `TransactionType` now includes `'SPEND'`. Task 21 renders it.

- [ ] **Step 1: Write the failing assertions**

Append to `main()` in `scripts/verify-vault-backend.ts`, before `finally`:

```ts
// 2 — funding a contract writes a brand-side SPEND row for the gross amount.
const funded = await seedPendingPaymentAndCompleteCheckout();
const brandRows = await TransactionModel.find({
  userId: funded.brandId,
  paymentId: funded.paymentId,
}).lean();
check(
  'funding writes one brand SPEND row',
  brandRows.length === 1 && brandRows[0]?.type === 'SPEND'
);
check('brand SPEND row is negative gross amount', brandRows[0]?.amount === -funded.grossAmount);

// 3 — the creator row is unchanged and still uses creatorAmount.
const creatorRows = await TransactionModel.find({
  userId: funded.creatorId,
  paymentId: funded.paymentId,
}).lean();
check(
  'creator EARNING row still uses creatorAmount',
  creatorRows[0]?.type === 'EARNING' && creatorRows[0]?.amount === funded.creatorAmount
);
```

`seedPendingPaymentAndCompleteCheckout()` seeds a `PENDING` payment then calls
`paymentService.handleCheckoutCompleted({ id: 'cs_test_vault', metadata: { paymentId }, payment_intent: 'pi_test_vault' } as never)` — driving the handler directly rather than going through Stripe. Return `{ brandId, creatorId, paymentId, grossAmount, creatorAmount }`.

- [ ] **Step 2: Run and watch them fail**

```bash
pnpm tsx scripts/verify-vault-backend.ts
```

Expected: `FAIL funding writes one brand SPEND row` (zero rows exist for the brand).

- [ ] **Step 3: Add `SPEND` to the transaction types**

`src/modules/payments/payment.types.ts` — replace the `TRANSACTION_TYPES` line:

```ts
export const TRANSACTION_TYPES = ['EARNING', 'PAYOUT', 'REFUND', 'SPEND'] as const;
```

The `transaction.model.ts` schema already reads its enum from this constant, so no model edit is needed. Confirm that by reading the file before moving on.

- [ ] **Step 4: Write the brand row on funding**

In `payment.service.ts` → `handleCheckoutCompleted`, directly after the existing creator `EARNING` `transactionRepository.create({…})` call:

```ts
await transactionRepository.create({
  userId: payment.brandId,
  paymentId: payment._id,
  contractId: payment.contractId,
  type: 'SPEND',
  amount: -payment.amount,
  currency: payment.currency,
  description: `Escrow funded for contract ${payment.contractId.toString()}`,
});
```

- [ ] **Step 5: Write the brand row on refund**

In `payment.service.ts` → `refundPayment`, directly after the existing creator `REFUND` `transactionRepository.create({…})` call:

```ts
await transactionRepository.create({
  userId: payment.brandId,
  paymentId: payment._id,
  contractId: contract._id,
  type: 'REFUND',
  amount: payment.amount,
  currency: payment.currency,
  description: `Refund received for contract ${contractId}`,
});
```

- [ ] **Step 6: Open the transactions route to brands**

`src/modules/payments/payment.routes.ts` — the `/transactions` route. It already filters by `userId` in `listMyTransactions`, so it is correctly scoped for both roles:

```ts
router.get(
  '/transactions',
  authenticate,
  authorize(['CREATOR', 'BRAND']),
  validate({ query: listPaymentsQuerySchema }),
  paymentController.transactions
);
```

- [ ] **Step 7: Run and watch them pass**

```bash
pnpm tsx scripts/verify-vault-backend.ts
```

Expected: `4 passed, 0 failed`.

- [ ] **Step 8: Confirm the build**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

- [ ] **Step 9: Commit**

```bash
git add src/modules/payments scripts/verify-vault-backend.ts
git commit -m "feat(payments): mirror brand-side ledger entries and open transactions to brands"
```

---

### Task 3: Environment for the new origin

Spec §8.3. `WEB_APP_URL` drives Stripe `success_url`/`cancel_url`/Connect return **and** password-reset/verification email links.

**Files:**

- Modify: `.env` (local, gitignored)
- Modify: `.env.example` (documented template)

- [ ] **Step 1: Update `.env`**

```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
WEB_APP_URL=http://localhost:3001
```

- [ ] **Step 2: Document it in `.env.example`**

Update the `CORS_ORIGINS` and `WEB_APP_URL` lines with a comment noting `:3001` is the `vault/` app and `:3000` is legacy `web/`, and that `WEB_APP_URL` decides which app receives Stripe redirects and email links.

- [ ] **Step 3: Restart and confirm**

`tsx watch` does **not** reload on `.env` change — restart `pnpm dev` fully.

```bash
curl -s -i -H "Origin: http://localhost:3001" http://localhost:8080/api/v1/health | head -20
```

Expected: `200` and an `Access-Control-Allow-Origin: http://localhost:3001` header. Paste the output.

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "chore(env): allow the vault origin and point app URLs at :3001"
```

---

# Phase 1 — Foundation

---

### Task 4: Scaffold `vault/`

Pin versions explicitly rather than running `create-next-app` — it prompts interactively and would drift from the versions this repo already proves work.

**Files:**

- Create: `vault/package.json`, `vault/tsconfig.json`, `vault/next.config.ts`, `vault/postcss.config.mjs`, `vault/eslint.config.mjs`, `vault/.gitignore`, `vault/.env.local`, `vault/.env.example`, `vault/README.md`
- Create: `vault/app/layout.tsx`, `vault/app/page.tsx`, `vault/styles/globals.css` (placeholder, replaced in Task 5)

**Interfaces:**

- Produces: a `vault/` app that builds and serves on `:3001`; alias `@/*` → `vault/*`.

- [ ] **Step 1: Write `vault/package.json`**

```json
{
  "name": "vault",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "eslint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.4.0",
    "@tanstack/react-query": "^5.101.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.4.0",
    "lenis": "^1.3.11",
    "lucide-react": "^1.21.0",
    "motion": "^12.40.0",
    "next": "16.2.9",
    "radix-ui": "^1.6.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-hook-form": "^7.79.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Write the config files**

`vault/postcss.config.mjs` (Tailwind v4 — verified via context7):

```js
const config = { plugins: ['@tailwindcss/postcss'] };
export default config;
```

`vault/tsconfig.json` — copy the shape of `web/tsconfig.json` (strict, `moduleResolution: "bundler"`, `jsx: "preserve"`, the `next` plugin) with `"paths": { "@/*": ["./*"] }`.

`vault/next.config.ts`:

```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
```

`vault/.gitignore` — `node_modules`, `.next`, `.env*.local`, `*.tsbuildinfo`, `.DS_Store`.

`vault/.env.local` and `vault/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

There is deliberately **no** `NEXT_PUBLIC_USE_MOCK`. This app has no mock mode.

- [ ] **Step 3: Install**

```bash
cd vault && pnpm install
```

- [ ] **Step 4: Minimal root layout and a placeholder page**

`vault/app/layout.tsx` — a root layout importing `@/styles/globals.css`, `<html lang="en" className="dark">`, `<body>{children}</body>`. `vault/styles/globals.css` for now is just `@import "tailwindcss";`. `vault/app/page.tsx` renders an `<h1>Vault</h1>`.

- [ ] **Step 5: Verify it builds and runs**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
pnpm dev   # then: curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001
```

Expected: three exit-0s, then `200`. Paste both.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "chore(vault): scaffold Next.js 16 app on :3001"
```

---

### Task 5: Vault design tokens and typography

Spec §4. **Load `ui-ux-pro-max` before starting** for token layering and scale construction, and **`design-taste-frontend`** to keep the result from reading as a default dark dashboard.

**Files:**

- Modify: `vault/styles/globals.css`
- Modify: `vault/app/layout.tsx` (fonts)
- Create: `vault/lib/utils.ts` (`cn`)
- Create: `vault/app/style/page.tsx` (kitchen-sink proof page)

**Interfaces:**

- Produces: Tailwind utilities `bg-ink`, `bg-surface`, `text-gold`, `text-bone`, `border-line`, `font-display`, `font-mono`, `font-sans`; `cn(...)` from `@/lib/utils`.

- [ ] **Step 1: Write the token layer**

`vault/styles/globals.css` — Tailwind v4 CSS-first config (verified via context7):

```css
@import 'tailwindcss';

@theme {
  --color-ink: #080b0a;
  --color-ink-2: #0a0f0d;
  --color-surface: #101917;
  --color-surface-2: #14201d;
  --color-emerald-deep: #123028;
  --color-emerald-lo: #0e211c;
  --color-gold: #c9a227;
  --color-gold-lo: #d9b84a;
  --color-gold-hi: #f0d67a;
  --color-bone: #ede9df;
  --color-bone-2: #b9c0bb;
  --color-muted: #7e8a84;
  --color-muted-2: #5c6762;
  --color-positive: #4ade80;
  --color-negative: #f87171;
  --color-warning: #e0a33e;
  --color-info: #6ba8c9;

  --color-line: color-mix(in oklab, #c9a227 16%, transparent);
  --color-line-2: color-mix(in oklab, #ede9df 9%, transparent);

  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-playfair), Georgia, serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 13px;
  --radius-2xl: 16px;

  --shadow-gold: 0 6px 20px color-mix(in oklab, #c9a227 28%, transparent);
}

:root {
  color-scheme: dark;
}

body {
  background: var(--color-ink);
  color: var(--color-bone);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* Every figure in a table, row, stat or badge. Spec §4. */
.tnum {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Wire the three font voices**

`vault/app/layout.tsx` — `next/font/google`, self-hosted automatically:

```tsx
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600'],
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});
```

Apply `className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}` on `<html>`.

- [ ] **Step 3: Write `cn`**

`vault/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Build the kitchen-sink page**

`vault/app/style/page.tsx` — render every token as a swatch, all three type voices with a money specimen, and the radius/shadow scale. This page is the visual regression surface for Tasks 6–8; keep it updated as primitives land.

- [ ] **Step 5: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Then open `http://localhost:3001/style` and confirm: gold reads as metal not yellow; Playfair renders on the money specimen; `.tnum` digits do not shift width when the value changes.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): Vault design tokens, three type voices, style reference page"
```

---

### Task 6: UI primitives

**Load `ui-ux-pro-max`** for component API shape. **Search 21st.dev first** (`mcp__21st__search`) for each primitive; adapt what is good, restyle everything to Vault tokens. Nothing is dropped in as-is.

**Files:**

- Create: `vault/components/ui/{button,card,dialog,sheet,table,input,textarea,select,badge,tabs,tooltip,skeleton,separator,dropdown-menu,avatar}.tsx`
- Create: `vault/components/feedback/{empty-state,error-state,query-boundary}.tsx`
- Modify: `vault/app/style/page.tsx`

**Interfaces:**

- Produces:
  - `<Button variant="gold"|"ghost"|"quiet"|"danger" size="sm"|"md"|"lg" loading?: boolean>` — `gold` is reserved for the single money action per screen.
  - `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardBody>`, `<CardFooter>`
  - `<Badge tone="gold"|"positive"|"negative"|"warning"|"muted">`
  - `<EmptyState icon title description action?>`, `<ErrorState error onRetry>`
  - `<QueryBoundary query={UseQueryResult} skeleton={ReactNode}>{(data) => ReactNode}</QueryBoundary>` — the single place pending/error/empty are handled.

- [ ] **Step 1: Source candidates**

```
mcp__21st__search { query: "dark table data grid", type: "component", limit: 6 }
mcp__21st__search { query: "dialog modal confirm destructive", type: "component", limit: 6 }
```

Note in the commit message which components (if any) were adopted and from whom.

- [ ] **Step 2: Build `Button` with the gold variant**

`class-variance-authority` for variants. The gold variant carries `shadow-gold` and the sheen sweep (a `::after` gradient on a 3.4s loop, disabled under reduced motion). `loading` swaps children for a spinner and sets `disabled` + `aria-busy`.

- [ ] **Step 3: Build the remaining primitives**

Radix under the hood for `dialog`, `sheet`, `select`, `tabs`, `tooltip`, `dropdown-menu`, `avatar`, `separator`. Plain elements for `card`, `input`, `textarea`, `badge`, `skeleton`, `table`. Skeletons must mirror the shape of the content they replace — never a generic bar.

- [ ] **Step 4: Build `QueryBoundary`**

```tsx
'use client';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState } from '@/components/feedback/error-state';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({ query, skeleton, children }: QueryBoundaryProps<T>) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <>{children(query.data)}</>;
}
```

Empty is **not** handled here — it is the caller's job, because an empty wallet and an empty contract list need different words. That is deliberate; do not "simplify" it.

- [ ] **Step 5: Add every primitive to `/style`**

- [ ] **Step 6: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Then open `/style` and tab through it with the keyboard: every interactive element must show a visible gold focus ring, and dialogs must trap focus and close on Escape.

- [ ] **Step 7: Commit**

```bash
git add vault/
git commit -m "feat(vault): UI primitives on Radix with Vault styling"
```

---

### Task 7: Money components

Spec §4. This is the layer that makes the app what it is. **Load `ui-ux-pro-max`.**

**Files:**

- Create: `vault/lib/money.ts`
- Create: `vault/components/money/{amount,balance-card,escrow-tracker,ledger-table}.tsx`
- Modify: `vault/app/style/page.tsx`

**Interfaces:**

- Produces:
  - `formatMoney(minor: number, currency: string): string` — `4825000, "USD"` → `"$48,250.00"`
  - `splitMoney(minor, currency): { whole: string; fraction: string; symbol: string }` — lets `<Amount>` colour the decimals in gold
  - `<Amount minor={number} currency={string} variant="display"|"figure" signed?: boolean />`
  - `<BalanceCard label amount currency sub? action? />`
  - `<EscrowTracker status={ContractStatus} />` — steps `FUNDED → SUBMITTED → APPROVED → COMPLETED`
  - `<LedgerTable transactions={Transaction[]} />`

- [ ] **Step 1: Write `lib/money.ts`**

```ts
/** Backend money is always integer minor units. Format only at the render edge. */
export function formatMoney(minor: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export function splitMoney(
  minor: number,
  currency = 'USD'
): {
  symbol: string;
  whole: string;
  fraction: string;
  negative: boolean;
} {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).formatToParts(Math.abs(minor) / 100);
  const pick = (t: string) =>
    parts
      .filter((p) => p.type === t)
      .map((p) => p.value)
      .join('');
  return {
    symbol: pick('currency'),
    whole: parts
      .filter((p) => ['integer', 'group'].includes(p.type))
      .map((p) => p.value)
      .join(''),
    fraction: pick('fraction'),
    negative: minor < 0,
  };
}
```

- [ ] **Step 2: Write `<Amount>`**

`variant="display"` → `font-display` with the fraction in `text-gold`. `variant="figure"` → `.tnum`, and when `signed`, `text-positive` / `text-negative` with an explicit `+`/`−`. Both render `<span className="tabular-nums">` so column widths never jitter.

- [ ] **Step 3: Write `<EscrowTracker>`**

Four steps derived from the live contract status. Map: `FUNDED`→1, `SUBMITTED`→2, `APPROVED`→3, `COMPLETED`→4; `PENDING_FUNDING`→0; `CANCELLED`/`DISPUTED` render a terminal state instead of the track. Completed steps are `positive`, the current step pulses gold, future steps are `muted-2`. The pulse is CSS-only so it costs nothing and stops under reduced motion.

- [ ] **Step 4: Write `<BalanceCard>` and `<LedgerTable>`**

`BalanceCard` — radial gold bloom via a pseudo-element, `<Amount variant="display">`, optional action slot. `LedgerTable` — description, type badge (`EARNING`/`PAYOUT`/`REFUND`/`SPEND`), `<Amount variant="figure" signed>` right-aligned, mono date.

- [ ] **Step 5: Add all four to `/style` with real-looking minor-unit values**

- [ ] **Step 6: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

On `/style`, confirm `formatMoney(0)` renders `$0.00` (not blank, not `—`) and `formatMoney(-270000)` renders as a negative.

- [ ] **Step 7: Commit**

```bash
git add vault/
git commit -m "feat(vault): money primitives — Amount, BalanceCard, EscrowTracker, LedgerTable"
```

---

### Task 8: Motion system

Spec §5. **Load `emil-design-eng` before starting** — it governs what earns motion, easing, duration and interruption.

**Files:**

- Create: `vault/lib/motion.ts`, `vault/components/motion/{reveal,count-up,smooth-scroll,payout-release}.tsx`
- Modify: `vault/app/layout.tsx` (mount `SmoothScroll`)

**Interfaces:**

- Produces:
  - `springs` / `easings` from `@/lib/motion`
  - `useReducedMotion(): boolean`
  - `<Reveal delay?>` — scroll-triggered fade+rise, runs once
  - `<CountUp minor currency variant />` — animates 0 → value, ~900ms
  - `<SmoothScroll>` — Lenis provider, disabled under reduced motion
  - `<PayoutRelease amount currency onDone />` — the escrow→balance set-piece

- [ ] **Step 1: Write `lib/motion.ts`**

```ts
export const easings = {
  out: [0.16, 1, 0.3, 1] as const, // primary — decelerate
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

export const springs = {
  gentle: { type: 'spring', stiffness: 180, damping: 26 },
  snappy: { type: 'spring', stiffness: 320, damping: 30 },
} as const;

export const durations = { fast: 0.18, base: 0.32, slow: 0.6, money: 0.9 } as const;
```

- [ ] **Step 2: Write `useReducedMotion`**

Wrap `window.matchMedia("(prefers-reduced-motion: reduce)")` with a `useSyncExternalStore` subscription so it reacts if the user changes the setting mid-session. Every motion component consults it and returns its static end-state when true.

- [ ] **Step 3: Write `<SmoothScroll>`**

Lenis with `lerp: 0.09`, driven by `requestAnimationFrame`. **Do not instantiate at all** under reduced motion — return `children` untouched. Destroy on unmount.

- [ ] **Step 4: Write `<Reveal>` and `<CountUp>`**

`Reveal` — Motion's `whileInView` with `once: true`, `margin: "-12% 0px"`, opacity 0→1 and y 16→0 over `durations.base` with `easings.out`.
`CountUp` — `animate()` from Motion over `durations.money`; renders through `<Amount>` so the format is identical to the static case. Under reduced motion, render the final value immediately with no animation frame at all.

- [ ] **Step 5: Write `<PayoutRelease>`**

The set-piece: escrow figure counts down to zero while the available balance counts up by the same amount, gold particles settle, then a confirmation line. Must be **interruptible** — if the component unmounts mid-animation the balance still lands on its true value. Under reduced motion it is a state swap plus a toast, no animation.

- [ ] **Step 6: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Then, on `/style`: scroll and confirm reveals fire once and never re-trigger; enable **System Settings → Accessibility → Display → Reduce motion** and reload — Lenis must not initialise, count-ups must show final values instantly, and the gold sheen must not run. Report what you observed in both states.

- [ ] **Step 7: Commit**

```bash
git add vault/
git commit -m "feat(vault): motion system — Lenis, reveals, count-up, payout set-piece"
```

---

# Phase 2 — Data layer

---

### Task 9: API client and contract types

Spec §6.

**Files:**

- Create: `vault/lib/api/types.ts`, `vault/lib/api/client.ts`

**Interfaces:**

- Produces:
  - `apiFetch<T>(path, init?): Promise<{ data: T; meta?: ApiMeta }>`
  - `class ApiError extends Error { status: number; errors: ApiFieldError[] }`
  - `setAccessTokenGetter(fn)`, `setRefreshHandler(fn)`
  - Domain types: `Role`, `Campaign`, `Application`, `Offer`, `Contract`, `ContractStatus`, `Submission`, `Payment`, `Wallet`, `Transaction`, `TransactionType`, `Notification`, `AuthUser`, `Session`

- [ ] **Step 1: Write `types.ts` from the backend's own type files**

Mirror `src/modules/*/**.types.ts` exactly. Money fields are `number` (minor units) and must be commented as such. `TransactionType` is `"EARNING" | "PAYOUT" | "REFUND" | "SPEND"` — including the type added in Task 2.

- [ ] **Step 2: Write `client.ts`**

Typed `fetch` over both envelopes; `credentials: "include"`; `Authorization` from the in-memory getter; on `401`, call the refresh handler once and retry; never retry a `/auth/` path. Throw `ApiError` carrying `status` and `errors[]` so forms can map the 422 envelope onto fields.

- [ ] **Step 3: Verify the round-trip**

With the backend running:

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Then from the browser console at `http://localhost:3001`, call the health endpoint through `apiFetch` and paste the response. It must return the envelope's `data`, not the envelope.

- [ ] **Step 4: Commit**

```bash
git add vault/lib/api
git commit -m "feat(vault): typed API client with 401 refresh-and-retry"
```

---

### Task 10: Auth provider and route guards

Spec §6.

**Files:**

- Create: `vault/lib/api/endpoints/auth.ts`, `vault/lib/auth/{auth-provider,auth-gate}.tsx`
- Modify: `vault/app/layout.tsx`

**Interfaces:**

- Consumes: `apiFetch`, `setAccessTokenGetter`, `setRefreshHandler` (Task 9).
- Produces: `useAuth(): { user, role, isAuthenticated, isLoading, login, register, verifyEmail, resendVerification, logout, refresh }`; `<AuthGate>` redirecting unauthenticated users to `/login`.

- [ ] **Step 1: Write the auth endpoints**

`login`, `register`, `refreshSession`, `verifyEmail`, `resendVerification`, `logout` against `/auth/*`. All return the backend's `data`.

- [ ] **Step 2: Write the provider**

Access token in a `useRef`, **never** `localStorage`. On mount, call `/auth/refresh`; success hydrates the session, failure renders logged-out. Register the token getter and refresh handler with the client. There is exactly one provider — no mock variant, no role switcher.

- [ ] **Step 3: Write `<AuthGate>`**

Wraps `(app)`. While `isLoading`, render a shell-shaped skeleton (not a spinner, not a flash of the login page). When unauthenticated, `router.replace("/login")`.

- [ ] **Step 4: Verify the round-trip**

Seed data first: `pnpm seed:demo` in the repo root (password `Demo1234!`).

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Then in the browser: log in as a demo creator, hard-refresh, and confirm the session survives via the refresh cookie. Then log out and confirm `/dashboard` redirects to `/login`. Report both.

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): live auth provider with refresh rotation and route gate"
```

---

### Task 11: Query keys and invalidation map

Spec §6.

**Files:**

- Create: `vault/lib/query.ts`, `vault/components/providers/query-provider.tsx`
- Modify: `vault/app/layout.tsx`

**Interfaces:**

- Produces: `qk` (key factory) and `invalidateFor(client, event)` where `event` is one of `"fund" | "release" | "refund" | "submit" | "approve" | "reject" | "revision" | "apply" | "counter" | "accept" | "notification"`.

- [ ] **Step 1: Write the key factory**

```ts
export const qk = {
  me: () => ['me'] as const,
  campaigns: (f?: Record<string, unknown>) => ['campaigns', f ?? {}] as const,
  campaign: (id: string) => ['campaign', id] as const,
  applications: (scope: 'mine' | 'received') => ['applications', scope] as const,
  application: (id: string) => ['application', id] as const,
  contracts: () => ['contracts'] as const,
  contract: (id: string) => ['contract', id] as const,
  submissionsFor: (contractId: string) => ['submissions', contractId] as const,
  wallet: () => ['wallet'] as const,
  transactions: () => ['transactions'] as const,
  connectStatus: () => ['connect-status'] as const,
  notifications: () => ['notifications'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
} as const;
```

- [ ] **Step 2: Write the invalidation map**

One exported function listing, per event, every key to invalidate. `"release"` must invalidate `contract`, `contracts`, `wallet`, `transactions`. `"fund"` must invalidate `contract`, `contracts`, `wallet`, `transactions`. Writing this once, in one file, is the point — screens never hand-roll invalidation.

- [ ] **Step 3: Write the provider**

`QueryClient` with `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: true`. Mount in the root layout inside `<SmoothScroll>`.

- [ ] **Step 4: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): centralised query keys and invalidation map"
```

---

### Task 12: SSE over `fetch`

Spec §6 — the notable one. `GET /notifications/stream` is behind `authenticate`, which reads only the `Authorization` header, and `EventSource` cannot set headers. This is why `web/` never wired the stream.

**Files:**

- Create: `vault/lib/api/stream.ts`, `vault/lib/notifications/use-notification-stream.ts`

**Interfaces:**

- Produces: `openEventStream({ path, token, onEvent, signal })` and `useNotificationStream()`.

- [ ] **Step 1: Write the stream reader**

```ts
/**
 * SSE over fetch. The backend guards /notifications/stream with a Bearer token
 * and EventSource cannot set headers, so the frames are parsed by hand.
 */
export interface StreamEvent {
  event: string;
  data: unknown;
}

export async function openEventStream(opts: {
  url: string;
  token: string;
  signal: AbortSignal;
  onEvent: (e: StreamEvent) => void;
}): Promise<void> {
  const res = await fetch(opts.url, {
    headers: { Authorization: `Bearer ${opts.token}`, Accept: 'text/event-stream' },
    credentials: 'include',
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`Stream failed (${res.status})`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += value;

    // SSE frames are separated by a blank line.
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      let name = 'message';
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) name = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      const raw = dataLines.join('\n');
      try {
        opts.onEvent({ event: name, data: JSON.parse(raw) });
      } catch {
        opts.onEvent({ event: name, data: raw });
      }
    }
  }
}
```

- [ ] **Step 2: Write the hook**

Opens the stream when authenticated, with an `AbortController` torn down on logout/unmount. Reconnect with exponential backoff (1s, doubling, cap 30s), reset on a successful frame. On each event: `toast()` it, and call `invalidateFor(client, "notification")` plus any key the payload implicates.

- [ ] **Step 3: Verify the round-trip**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

With `vault/` open and logged in as a demo brand, trigger a real domain event from another terminal — e.g. have a demo creator apply to that brand's campaign via `curl`. A toast must appear **without a refresh**. Paste the curl and describe what appeared. Then stop the backend and confirm the client retries with growing gaps rather than hammering.

- [ ] **Step 4: Commit**

```bash
git add vault/
git commit -m "feat(vault): live notification stream over fetch (EventSource can't send Bearer)"
```

---

# Phase 3 — Shell and auth

---

### Task 13: App shell

**Load `design-taste-frontend`** — the sidebar/topbar is where dashboards look most templated. It must not.

**Files:**

- Create: `vault/app/(app)/layout.tsx`, `vault/components/layout/{app-shell,sidebar,top-bar,nav-config,notification-bell,account-menu,page-header}.tsx`

**Interfaces:**

- Consumes: `useAuth` (Task 10), `useNotificationStream` (Task 12).
- Produces: `navFor(role: Role): NavSection[]`; `<PageHeader title description? action?>`.

- [ ] **Step 1: Write role-aware nav**

CREATOR: Dashboard · Find campaigns · Negotiations · Contracts · Wallet · Notifications · Settings.
BRAND: Dashboard · My campaigns · Find creators · Negotiations · Contracts · Wallet · Notifications · Settings.
ADMIN is out of scope — if an ADMIN logs in, show a one-line "Admin console is not part of Vault yet" panel rather than a broken shell.

- [ ] **Step 2: Build sidebar, top bar and unread bell**

Active item gets the gold inset rule from the mockup. The bell reads `qk.unreadCount()` and is bumped live by the stream.

- [ ] **Step 3: Responsive**

Sidebar collapses to a Radix `Sheet` under `lg`. No horizontal page scroll at 360px.

- [ ] **Step 4: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Log in as both a demo creator and a demo brand; confirm each sees only their own nav. Resize to 360px and confirm no horizontal scroll.

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): role-aware app shell"
```

---

### Task 14: Auth screens

**Files:**

- Create: `vault/app/(auth)/layout.tsx` and `{login,register,verify-email,forgot-password,reset-password}/page.tsx`
- Create: `vault/components/auth/*`, `vault/lib/validations/auth.ts`

**Interfaces:**

- Consumes: `useAuth` (Task 10), `ApiError` (Task 9).

- [ ] **Step 1: Zod schemas mirroring the backend validators**

Read `src/modules/auth/auth.validators.ts` and mirror it exactly — same min lengths, same rules. A client rule stricter than the server confuses; looser wastes a round trip.

- [ ] **Step 2: Build the five screens**

Split layout: form left, a Vault-toned brand panel right. Register asks CREATOR or BRAND (ADMIN is never self-assignable — do not offer it).

- [ ] **Step 3: Map server errors onto fields**

On `ApiError` with `status === 422`, walk `errors[]` and call `setError(field, …)`. Anything else becomes a toast. This is the payoff for carrying `errors[]` through the client.

- [ ] **Step 4: `verify-email` reads its token from `searchParams`**

Next 16: `searchParams` is a Promise. In a client component use `use(searchParams)`; in a server component `await` it. Verified via context7 — do not use the v15 synchronous form.

- [ ] **Step 5: Verify the round-trip**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Register a brand-new `vault-test-*@test.local` user; confirm the verification email link (Ethereal preview URL in the backend logs) points at **`:3001`** — proving Task 3's `WEB_APP_URL` change. Then submit the form with a 5-character password and confirm the server's 422 lands on the password field, not in a toast. Paste both.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): auth screens with server-mapped field errors"
```

---

# Phase 4 — The money spine

---

### Task 15: Marketplace

**Files:**

- Create: `vault/lib/api/endpoints/{campaigns,assets}.ts`
- Create: `vault/app/(app)/marketplace/page.tsx`, `.../marketplace/[id]/page.tsx` (campaigns — the creator's "Find campaigns")
- Create: `vault/app/(app)/assets/page.tsx`, `.../assets/[id]/page.tsx` (creator asset listings — the brand's "Find creators")
- Create: `vault/app/(app)/campaigns/mine/page.tsx` (brand's own campaigns)
- Create: `vault/components/marketplace/{filter-rail,campaign-card,campaign-detail,asset-card,asset-detail,availability-pill}.tsx`

**Interfaces:**

- Consumes: `apiFetch`, `qk`, `QueryBoundary`, `<Amount>`.
- Produces: `getCampaigns(filters)`, `getCampaign(id)`, `getMyCampaigns()`, `getAssets(filters)`, `getAsset(id)`. Each list returns `{ items, meta }`; each detail returns the entity or throws `ApiError` with `status: 404`.

- [ ] **Step 1: Endpoints**

`GET /campaigns` with `page`/`limit`/`assetType`/`platform`/`minBudget`/`maxBudget`/`search`; `GET /campaigns/:id`; `GET /campaigns/mine`; `GET /assets`. Return `{ items, meta }`.

- [ ] **Step 2: Browse screen**

Filter rail + card grid + pagination from `meta`. Filters live in the URL query so a filtered view is shareable and survives refresh. Budget renders through `<Amount variant="figure">` — these are minor units.

- [ ] **Step 3: Empty and error states**

Empty must be role-aware and specific: creator → "No campaigns match these filters." with a clear-filters action; brand on `/campaigns/mine` → "You haven't posted a campaign yet."

- [ ] **Step 4: Detail page**

`app/(app)/marketplace/[id]/page.tsx`. Next 16: `params` is a Promise — `await` it in a server component or `use()` it in a client component.

- [ ] **Step 5: Verify the round-trip**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

With seeded data, browse as a creator and confirm real campaign titles appear. Then filter to something that matches nothing and confirm you get the **empty state, not fixtures** — this is the single most important behavioural difference from `web/`. Paste what you saw.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): campaign and asset marketplace"
```

---

### Task 16: Negotiation

**Files:**

- Create: `vault/lib/api/endpoints/applications.ts`
- Create: `vault/app/(app)/negotiations/page.tsx`, `.../negotiations/[id]/page.tsx`
- Create: `vault/components/negotiation/{offer-thread,offer-composer,apply-dialog,turn-banner}.tsx`

**Interfaces:**

- Produces: `apply(input)`, `getMyApplications()`, `getReceivedApplications()`, `getApplication(id)`, `counterOffer(id, {amount, message})`, `acceptOffer(id)`, `rejectOffer(id)`, `withdraw(id)`.

- [ ] **Step 1: Endpoints against `/applications/*`**

- [ ] **Step 2: Offer thread**

The embedded `offers[]` array as a conversation. Each offer shows sender, amount (`<Amount variant="figure">`), message, status. Shared-layout transition when a new offer is appended.

- [ ] **Step 3: Turn enforcement in the UI**

The backend enforces that only the pending offer's `receiver` may counter/accept. Mirror it: when it is not your turn, disable the composer and show a banner saying whose turn it is. **Never** show an action the server will reject.

- [ ] **Step 4: Apply dialog**

Creator-side. Note the backend's apply-time payout gate — a creator without a payout-ready Stripe account gets a 403. Catch that specific error and render an inline prompt linking to `/wallet` for onboarding, rather than a raw toast. This is a real state `web/` never surfaced.

- [ ] **Step 5: Verify the round-trip**

Run the checks, then: as a demo creator apply to a demo brand's campaign; as the brand, counter; as the creator, accept. Confirm the contract auto-generates and appears under `/contracts`. Confirm that while it is the brand's turn, the creator's composer is disabled. Paste the sequence.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): negotiation centre with turn-aware offer thread"
```

---

### Task 17: Contracts

**Files:**

- Create: `vault/lib/api/endpoints/contracts.ts`
- Create: `vault/app/(app)/contracts/page.tsx`, `.../contracts/[id]/page.tsx`
- Create: `vault/components/contract/{contract-header,deliverables-list,terms-panel}.tsx`

**Interfaces:**

- Produces: `getContracts(filters?)`, `getContract(id)`, `cancelContract(id)`.

- [ ] **Step 1: Endpoints against `/contracts`**

- [ ] **Step 2: List and detail**

Detail is the spine of Tasks 18–20: header with `<EscrowTracker>`, terms panel (agreed price, commission, creator net, timeline), deliverables. Leave a clearly marked slot for the money actions and the delivery panel.

- [ ] **Step 3: Commission maths from the server's own numbers**

Show agreed price, platform commission and creator net **from the payment record when one exists**, never recomputed client-side. Before funding, derive the preview from `PLATFORM_COMMISSION_PERCENT` and label it "estimated".

- [ ] **Step 4: Verify the round-trip**

Open the contract created in Task 16 as both parties. Confirm the tracker sits at `PENDING_FUNDING` and a non-party gets a 404, not a leak.

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): contract list and detail with escrow tracker"
```

---

### Task 18: Stripe checkout, success and cancel — the centrepiece

Spec §7. None of this exists in any form today; `/payments/success` currently 404s.

**Files:**

- Create: `vault/lib/api/endpoints/payments.ts`
- Create: `vault/app/(app)/payments/success/page.tsx`, `.../payments/cancel/page.tsx`
- Create: `vault/components/contract/fund-escrow-dialog.tsx`
- Modify: `vault/app/(app)/contracts/[id]/page.tsx`

**Interfaces:**

- Consumes: `getContract` (Task 17), `invalidateFor` (Task 11), `<PayoutRelease>` (Task 8).
- Produces: `createCheckout(contractId): Promise<{ checkoutUrl, paymentId }>`, `getWallet()`, `getTransactions()`, `getConnectStatus()`, `startConnectOnboarding()`.

- [ ] **Step 1: Endpoints**

`POST /payments/contracts/:contractId/checkout`, `GET /payments/wallet`, `GET /payments/transactions`, `GET /payments/connect/status`, `POST /payments/connect/onboard`.

- [ ] **Step 2: Fund dialog**

Brand-only, shown when `contract.status === 'PENDING_FUNDING'`. Gold button. The dialog states the agreed price, the platform commission, the creator's net, and plainly: _funds are held by the platform and released only when you approve the delivery._ On confirm, `window.location.href = checkoutUrl`.

- [ ] **Step 3: The success page and its race**

The webhook may not have landed when Stripe redirects the browser back. **Poll `GET /contracts/:id`** — `GET /payments` has no `contractId` filter (verified against `listPaymentsQuerySchema`).

```tsx
'use client';
import { use, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContract } from '@/lib/api/endpoints/contracts';
import { qk } from '@/lib/query';

const POLL_MS = 1500;
const GIVE_UP_MS = 20_000;

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  // Next 16: searchParams is a Promise; client components read it with use().
  const { contractId } = use(searchParams);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(t);
  }, []);

  const query = useQuery({
    queryKey: qk.contract(contractId ?? ''),
    queryFn: () => getContract(contractId as string),
    enabled: Boolean(contractId),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      const settled = status !== undefined && status !== 'PENDING_FUNDING';
      return settled || gaveUp ? false : POLL_MS;
    },
  });

  const confirmed = query.data?.status && query.data.status !== 'PENDING_FUNDING';
  // confirmed  → receipt + escrow-funded set-piece + link to the contract
  // !confirmed && gaveUp → honest holding state (see Step 4)
  // otherwise  → "Confirming with Stripe…" with the tracker mid-advance
}
```

- [ ] **Step 4: The honest pending state**

If 20s elapse with no confirmation, **never** claim success. Render: _"Stripe has your payment. We're waiting on confirmation from our side — this page updates itself, and you'll get a notification the moment escrow is funded."_ Offer a link to the contract and a manual retry.

- [ ] **Step 5: The cancel page**

Calm off-ramp: nothing was charged, escrow is unfunded, here is the contract. No red, no alarm.

- [ ] **Step 6: Verify the round-trip — real Stripe test mode**

Run the checks, then with Stripe test keys configured and `stripe listen --forward-to localhost:8080/api/v1/payments/webhook` running:

1. As a demo brand, fund the Task 16 contract.
2. Pay with `4242 4242 4242 4242`, any future expiry, any CVC.
3. Confirm the redirect lands on `/payments/success?contractId=…` — **not a 404**.
4. Confirm it flips to the receipt once the webhook lands.
5. Re-run with `stripe listen` **stopped** and confirm the 20s holding state appears and does not claim success.

Paste the outcome of all five. Step 5 is the one that matters most — it is the failure mode a happy-path test never catches.

- [ ] **Step 7: Commit**

```bash
git add vault/
git commit -m "feat(vault): Stripe checkout with race-safe success and cancel pages"
```

---

### Task 19: Delivery and review

**Files:**

- Create: `vault/lib/api/endpoints/submissions.ts`
- Create: `vault/components/contract/{delivery-panel,proof-form,proof-display,review-actions}.tsx`
- Modify: `vault/app/(app)/contracts/[id]/page.tsx`

**Interfaces:**

- Produces: `createSubmission(input)`, `updateSubmission(id, input)`, `submitSubmission(id)`, `approveSubmission(id)`, `rejectSubmission(id, note)`, `requestRevision(id, note)`, `getSubmissionsForContract(contractId)`.

- [ ] **Step 1: Endpoints against `/submissions/*`**

- [ ] **Step 2: Proof form (creator)**

Typed `files[]` (`SCREENSHOT` | `ANALYTICS_SCREENSHOT` | `DOCUMENT`, `url`, optional `caption`), `links[]` (`url`, optional `label`), `note`, optional `analytics{impressions,reach,likes,comments,shares,saves}`. URL-based — file upload is out of scope until a Cloudinary slice.

- [ ] **Step 3: Mirror the submit gate client-side**

The server requires ≥1 file or link to submit. Disable the submit button until that holds and say why, so the user never eats a 422 they could have been warned about. Drafts may be partial.

- [ ] **Step 4: Review actions (brand)**

Approve / request revision / reject. **Approve is the gold money action** — its dialog states the payout amount and that it is irreversible. Reject and revision take a note.

- [ ] **Step 5: Surface the deferred-payout state**

If the backend reports the payout was deferred because the creator is not payout-onboarded, the contract must show `APPROVED · payout pending creator onboarding` with a **Release payout** action for later. This is a real backend state no UI has ever shown — do not swallow it.

- [ ] **Step 6: Verify the round-trip**

Run the checks, then on the funded contract: as the creator create a draft, confirm submit is disabled with zero proof, add a link, submit. As the brand, request a revision; as the creator, resubmit; as the brand, approve. Confirm the tracker advances at each step and the contract reaches `APPROVED`. Paste the sequence.

- [ ] **Step 7: Commit**

```bash
git add vault/
git commit -m "feat(vault): delivery proof submission and brand review"
```

---

### Task 20: Release and refund

**Files:**

- Create: `vault/components/contract/{release-dialog,refund-dialog}.tsx`
- Modify: `vault/lib/api/endpoints/payments.ts`, `vault/app/(app)/contracts/[id]/page.tsx`

**Interfaces:**

- Consumes: `<PayoutRelease>` (Task 8), `invalidateFor` (Task 11).
- Produces: `releasePayment(contractId)`, `refundPayment(contractId)`.

- [ ] **Step 1: Endpoints**

`POST /payments/contracts/:contractId/release` and `/refund`.

- [ ] **Step 2: Release**

Shown when the contract is `APPROVED` and the payment is still `PAID` — i.e. the auto-release was deferred. Gold. On success, run `<PayoutRelease>` and advance the tracker to `COMPLETED`.

- [ ] **Step 3: Refund — visibility must mirror the backend exactly**

Shown when the payment is `PAID` **and** the contract is **not** `APPROVED` — so across `FUNDED`, `IN_PROGRESS` and `SUBMITTED`. This matches the guard added in Task 1 precisely: the UI never offers an action the server will reject, and never hides one it would allow. Destructive styling, typed confirmation, states that the contract will be cancelled.

- [ ] **Step 4: No optimistic updates**

Both mutations wait for the server and render the server's response. Money never moves in the UI before it moves on the server.

- [ ] **Step 5: Verify the round-trip**

Run the checks, then:

- **Refund:** fund a fresh contract, refund it before delivery, confirm the contract goes `CANCELLED`, the creator's pending balance drops, and **both** ledgers now show a row (the brand row exists because of Task 2).
- **Guard:** on the Task 19 contract that reached `APPROVED`, confirm the refund action is **absent**, and that calling the endpoint directly with `curl` returns the 409 from Task 1. Paste the curl response.
- **Release:** onboard a real Stripe test Express account so the Transfer actually executes — per spec §10 this path has never run in this repo. Report whether the Transfer succeeded.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): payout release and refund with backend-mirrored guards"
```

---

### Task 21: Wallet

**Files:**

- Create: `vault/app/(app)/wallet/page.tsx`, `vault/app/(app)/payments/onboard/{return,refresh}/page.tsx`
- Create: `vault/components/wallet/{creator-wallet,brand-wallet,connect-status-card}.tsx`

**Interfaces:**

- Consumes: `getWallet`, `getTransactions`, `getConnectStatus`, `startConnectOnboarding` (Task 18); `<BalanceCard>`, `<LedgerTable>` (Task 7).

- [ ] **Step 1: Creator wallet**

`<BalanceCard>` for available balance, escrow panel with `<EscrowTracker>` for the active contract, `<LedgerTable>` of transactions. **An empty wallet renders `$0.00` and an empty ledger** — never a fixture.

- [ ] **Step 2: Brand wallet**

Total spend, refunded, net — from the brand's own transactions, which exist because of Task 2. Same `<LedgerTable>`, rendering `SPEND` and `REFUND` rows.

- [ ] **Step 3: Connect onboarding**

Status card driving `POST /payments/connect/onboard` → redirect. `/payments/onboard/return` invalidates `qk.connectStatus()` and confirms; `/refresh` offers to restart. Search 21st.dev for a status-card pattern worth adapting before hand-rolling.

- [ ] **Step 4: Verify the round-trip**

Run the checks, then: log in as a **brand-new** creator with no earnings and confirm `$0.00` and an empty ledger with no fixtures anywhere. Then as the Task 20 brand, confirm `SPEND` and `REFUND` rows render with correct signs. Paste both.

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): creator and brand wallets with live balances and ledger"
```

---

### Task 22: Notifications

**Files:**

- Create: `vault/lib/api/endpoints/notifications.ts`, `vault/app/(app)/notifications/page.tsx`
- Modify: `vault/components/layout/notification-bell.tsx`

**Interfaces:**

- Consumes: `useNotificationStream` (Task 12).
- Produces: `getNotifications(filters)`, `getUnreadCount()`, `markRead(id)`, `markAllRead()`, `deleteNotification(id)`, `getPreferences()`, `updatePreferences(input)`.

- [ ] **Step 1: Endpoints against `/notifications/*`**

- [ ] **Step 2: List screen**

Filters by `type` and `read`, pagination, mark-read, mark-all-read, delete. New notifications arriving over SSE prepend with a `Reveal`.

- [ ] **Step 3: Verify the round-trip**

Run the checks, then trigger a real domain event and confirm the row appears live **and** persists across a refresh (proving both the SSE push and the persisted record). Paste what you did.

- [ ] **Step 4: Commit**

```bash
git add vault/
git commit -m "feat(vault): notification centre with live stream"
```

---

### Task 23: Settings

**Files:**

- Create: `vault/app/(app)/settings/page.tsx`, `vault/components/settings/{profile,security,payouts,notifications}-settings.tsx`
- Create: `vault/lib/api/endpoints/profiles.ts`

**Interfaces:**

- Produces: `getMyCreatorProfile()`, `updateMyCreatorProfile(input)`, `getMyBrandProfile()`, `updateMyBrandProfile(input)`.

- [ ] **Step 1: Endpoints against `/creators/me` and `/brands/me`**

- [ ] **Step 2: Four tabs**

Profile (role-aware), Security (change password → note the backend nulls the refresh token, so the user is logged out; say so before they submit), Payouts (reuses the Connect card from Task 21), Notifications (per-type/per-channel muting from `/notifications/preferences`).

- [ ] **Step 3: Respect the injection blocks**

Verification fields (`verificationStatus`, `profileOwnershipStatus`, `verifiedStatus`) are rejected by the backend's `.strict()` bodies. Render them **read-only** with an explanatory line — never as editable inputs.

- [ ] **Step 4: Verify the round-trip**

Run the checks, then edit a creator display name and confirm it persists across a refresh. Change a password and confirm you are logged out as the backend intends.

- [ ] **Step 5: Commit**

```bash
git add vault/
git commit -m "feat(vault): settings — profile, security, payouts, notification prefs"
```

---

# Phase 5 — Landing and polish

---

### Task 24: Landing page

**Load `design-taste-frontend` first** — this is the screen most at risk of looking generated. **Load `emil-design-eng`** for the scroll choreography.

**Files:**

- Create: `vault/app/(marketing)/layout.tsx`, `vault/app/(marketing)/page.tsx`
- Create: `vault/components/marketing/{hero,how-it-works,escrow-explainer,for-creators,for-brands,pricing,faq,cta,footer,marketing-nav}.tsx`

- [ ] **Step 1: Hero**

Per the approved mockup: serif headline with one italic gold word, escrow-backed badge, dual CTA, and a stat strip whose figures count up from zero on entry. The grid backdrop drifts on scroll. Only one saturated element above the fold.

- [ ] **Step 2: The escrow explainer — the section that earns the page**

An animated, scroll-driven walkthrough of the real state machine: brand funds → held → creator delivers → brand approves → payout clears. Reuse `<EscrowTracker>` so the marketing claim and the product are literally the same component.

- [ ] **Step 3: Remaining sections**

How it works (creator and brand columns), pricing (the real 10% commission), FAQ, closing CTA, footer.

- [ ] **Step 4: Anti-generic audit**

Re-read `design-taste-frontend` and audit what you built: no three-equal-cards-with-icons row, no centred-everything, no stock gradient blobs, no lorem. If a section could belong to any SaaS, rebuild it.

- [ ] **Step 5: Verify**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
```

Scroll the whole page top to bottom. Then enable reduce-motion and confirm it is fully readable with no animation. Then check 360px width for horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add vault/
git commit -m "feat(vault): landing page with scroll-driven escrow explainer"
```

---

### Task 25: Final pass

**Files:**

- Create: `vault/README.md`
- Modify: whichever files the four sweeps below turn up defects in. Record each fix in the commit body so the sweep is auditable — a sweep that changes nothing means it was not actually run.

- [ ] **Step 1: Accessibility sweep**

Keyboard-only traverse of the full money spine: login → marketplace → negotiate → contract → fund → deliver → approve → wallet. Every control reachable, focus always visible, dialogs trap and restore focus. Check contrast on gold-on-ink and muted-on-ink; fix anything under 4.5:1 for body text.

- [ ] **Step 2: Reduced-motion sweep**

With the OS setting on, walk the same path. Lenis must not initialise; count-ups show final values; the payout set-piece degrades to a state change plus a toast.

- [ ] **Step 3: Empty-state sweep**

Create a fresh account with no data and visit **every** screen. Each must show a designed empty state. Any screen showing a fixture, a zero-height container or a crash is a bug — fix it. This is the plan's headline guarantee.

- [ ] **Step 4: Write `vault/README.md`**

What it is, how it differs from `web/`, how to run both (`:3000` legacy, `:3001` vault), the required backend env, and the seed/clean commands.

- [ ] **Step 5: Full verification**

```bash
cd vault && pnpm typecheck && pnpm lint && pnpm build
cd .. && pnpm typecheck && pnpm lint && pnpm build && pnpm tsx scripts/verify-vault-backend.ts
```

Paste all output. Every one must pass.

- [ ] **Step 6: Commit**

```bash
git add vault/ && git commit -m "chore(vault): accessibility, reduced-motion and empty-state pass"
```

---

## Definition of done

- [ ] `pnpm typecheck && pnpm lint && pnpm build` green in **both** `vault/` and the repo root.
- [ ] `pnpm tsx scripts/verify-vault-backend.ts` reports `0 failed`.
- [ ] A brand funds a real Stripe test-mode contract, the webhook lands, and `/payments/success` shows a receipt.
- [ ] `stripe listen` stopped → the success page shows the honest holding state and never claims success.
- [ ] A creator submits proof, a brand approves, and the payout state is correct.
- [ ] Refund is offered exactly when the backend would allow it, and the 409 guard is proven with `curl`.
- [ ] A notification arrives live over SSE without a refresh.
- [ ] A brand-new account shows designed empty states on every screen — **no fixtures anywhere in the app**.
- [ ] The whole spine is keyboard-navigable and usable under `prefers-reduced-motion`.
- [ ] `web/` is untouched: `git status web/` is clean and `git log web/` shows no new commits.
