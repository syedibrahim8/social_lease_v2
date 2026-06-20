# Creator Asset Marketplace — Frontend Design Spec

**Date:** 2026-06-19
**Status:** Approved (design) — implementation pending, built layer-by-layer on user command
**Scope:** Web frontend for the existing Express/Mongo backend. Backend is unchanged by this work.

---

## 1. Goal & constraints

A world-class, enterprise-grade SaaS marketplace UI connecting **Brands** and **Creators** via
campaign management, creator/asset discovery, negotiation, escrowed Stripe payments, proof-of-work
verification, and analytics. The product must read like a funded Series-A startup ($20M+):
premium, professional, trustworthy, minimal, elegant, modern.

**Hard product framing:** This is **not** an AI product, **not** a social-media app, **not** crypto.
AI features that exist in the backend (recommendations/brief/pricing/fraud) are presented as quiet,
explainable utilities — never as the product's identity.

**Visual inspiration:** Stripe, Linear, Mercury, Ramp, Vercel, Notion.
**Marketplace surfaces feel:** Airbnb + Upwork. **Dashboards feel:** Stripe + Linear + Mercury.
**Avoid:** AI-purple gradients, neon, glassmorphism, crypto/gaming aesthetics, excessive animation,
influencer aesthetics.

### Foundational decisions (locked)

- **Location:** new self-contained Next.js 15 app at `web/` inside this repo (own `package.json`/deps).
- **Data strategy:** **Hybrid** — design system + app shell + auth built against typed mock data
  behind a single swappable `lib/api` adapter; the live `/api/v1` backend is integrated
  feature-by-feature per layer.
- **Component base:** shadcn/ui (Radix primitives, owned in `components/ui`) re-themed to our tokens.

---

## 2. Tech stack

| Concern      | Choice                                       | Rationale                                                                             |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router, React 19, TS strict) | Matches CLAUDE.md; RSC + route groups for shell separation                            |
| Styling      | Tailwind v4 (CSS-first `@theme` tokens)      | Dark mode = CSS-variable swap; shadcn default. v3 JS-config is an acceptable fallback |
| Components   | shadcn/ui on Radix, owned in `components/ui` | Accessible primitives we control + theme                                              |
| Icons        | lucide-react                                 | Restrained line style, pairs with shadcn                                              |
| Animation    | Framer Motion                                | Fade/slide/scale only; reduced-motion aware                                           |
| Server state | TanStack Query                               | Loading/empty/error/success map to standard state surfaces                            |
| UI state     | Zustand                                      | Sidebar collapse, command menu, theme                                                 |
| Forms        | react-hook-form + Zod                        | Zod mirrors backend `*.validators.ts`; maps the 422 envelope                          |
| Charts       | Recharts                                     | Themeable, clean — analytics & wallet                                                 |
| Theme        | next-themes (`class` strategy)               | Dark mode                                                                             |
| Toasts       | sonner                                       | shadcn-recommended toaster                                                            |
| Utils        | clsx + tailwind-merge (`cn`), cva, date-fns  | Variants & formatting                                                                 |

### Backend interface (known facts the UI depends on)

- API base: `/api/v1` (`API_PREFIX`). CORS already allows `http://localhost:3000`; `WEB_APP_URL` points there.
- **Response envelopes:** success `{ success, message, data, meta? }`; error `{ success, message, errors[] }`.
  Validation failures are 422 with field errors. The API client normalizes both shapes.
- **Auth:** access JWT (~15m) returned in the JSON body; refresh JWT (~7d) as an httpOnly cookie scoped
  to `/api/v1/auth`. Single active session (refresh rotation). Roles: `CREATOR`, `BRAND`, `ADMIN`
  (ADMIN never self-assignable).
- **Money:** all amounts are integer **minor units (cents)** + currency. The UI never does float math;
  formatters and `MoneyInput` operate in minor units.
- **Real-time:** notifications stream over SSE at `GET /notifications/stream`.
- Module surface (mounted under `/api/v1`): auth, creators, brands, campaigns, applications, contracts,
  payments, submissions, assets, verifications, notifications, ai, analytics.

### Auth handling in the web app

Access token kept **in memory** in an `AuthProvider`; a fetch wrapper auto-refreshes on 401 via the
refresh cookie (`POST /auth/refresh`), retrying once. Lightweight middleware guards `(app)` routes.
During the mock phase this is a mock provider exposing a **role switcher** (Creator / Brand / Admin)
so every screen is reachable without a live backend.

---

## 3. Design system & tokens

Tokens live as CSS variables in `globals.css`; Tailwind v4 maps them to utilities. Dark mode flips one
class on `<html>`.

### Color — neutral scale (anchored on Primary `#111827`, Background `#FAFAFA`)

```
50 #FAFAFA  100 #F4F5F7  200 #E5E7EB  300 #D1D5DB  400 #9CA3AF
500 #6B7280 600 #4B5563  700 #374151  800 #1F2937  900 #111827  950 #0B0F19
```

### Color — accent (emerald)

`500 #10B981` base · `600 #059669` hover · `700 #047857` text-on-light · `50 #ECFDF5` tint.
On dark surfaces, accent text uses `#34D399` for contrast.

### Semantic

success `#22C55E` · warning `#F59E0B` · danger `#EF4444` · info (sparingly) `#3B82F6`.
Each has a `-subtle` background tint for badges/banners.

### Surface roles (drives clean dark mode)

| Role             | Light   | Dark    |
| ---------------- | ------- | ------- |
| background       | #FAFAFA | #0B0F19 |
| card             | #FFFFFF | #111827 |
| border           | #E5E7EB | #1F2937 |
| muted (fills)    | #F4F5F7 | #161B26 |
| foreground       | #111827 | #FAFAFA |
| muted-foreground | #6B7280 | #9CA3AF |

### Typography

**Geist** via `next/font`, **Inter** fallback. **Geist Mono** + `tabular-nums` for all money and IDs
(Mercury/Stripe alignment). Scale (px): `12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60`.
App base **14px**, marketing base 16px. Large headings tracking `-0.02em`.

### Spacing — strict 8px system

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.

### Radii

`sm 6 · md 8 · lg 10 · xl 12 · 2xl 16 · full`. Buttons/inputs `lg`, cards `xl`, pills `full`.

### Shadows (soft, border-led — not glassy)

```
xs  0 1px 2px rgba(16,24,40,.04)
sm  0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04)
md  0 4px 8px -2px rgba(16,24,40,.06), 0 2px 4px -2px rgba(16,24,40,.04)
lg  0 12px 24px -6px rgba(16,24,40,.10)   # popovers/modals
```

### Focus & motion

Focus ring: 2px emerald @ low alpha + 2px offset, **never removed**.
Motion durations `120 / 180 / 240ms`; entrance easing `cubic-bezier(.16,1,.3,1)`; hovers standard ease.
All animation gated behind `prefers-reduced-motion`.

---

## 4. Component architecture

Four tiers; each depends only on the tier below.

```
ui/        Primitives (shadcn, owned): button, input, select, checkbox, switch,
           textarea, badge, avatar, dialog, drawer (sheet), dropdown, popover,
           tooltip, tabs, table, skeleton, separator, toast, command (⌘K)

feedback/  State surfaces: Skeleton variants · EmptyState · ErrorState ·
           QueryBoundary (maps a TanStack Query → loading/empty/error/success)

domain/    cards/  CreatorCard · CampaignCard · WalletCard · AssetCard · StatCard · ContractCard
           data/   DataTable (sort/paginate/empty) · FilterBar · Pagination · StatusBadge
           forms/  Field (label+control+error) · MoneyInput (minor-units) · FileDrop

layout/    AppShell · Sidebar · TopNav · CommandMenu · NotificationCenter ·
           AccountMenu · PageHeader · ThemeToggle
```

`StatusBadge` is a single component driven by a status→variant map covering **every** backend enum
(campaign / application / offer / contract / payment / submission / verification states) so status
color is consistent platform-wide. All money components operate in minor units.

---

## 5. Layout architecture — three shells

1. **Marketing shell** `(marketing)` — transparent nav → solid on scroll, generous whitespace, footer. Public.
2. **Auth/Onboarding shell** `(auth)` / `(onboarding)` — centered split (form + quiet brand/testimonial panel);
   onboarding adds a stepper.
3. **App shell** `(app)` — collapsible **role-aware left sidebar** + top bar (global ⌘K search · notification
   bell with live SSE · account menu · theme toggle) + content area (max-width ~1280, consistent `PageHeader`).
   One shell; nav config keyed by role.

---

## 6. Page architecture — 14 deliverables → routes & roles

| #   | Deliverable               | Route                                                                     | Role                           | Feel                                                            |
| --- | ------------------------- | ------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| 1   | Landing                   | `/`                                                                       | Public                         | Stripe/Vercel marketing                                         |
| 2   | Auth                      | `/login` `/register` `/forgot-password` `/reset-password` `/verify-email` | Public                         | Minimal split                                                   |
| 3   | Creator onboarding        | `/onboarding/creator`                                                     | Creator                        | Wizard: profile → niche/socials → Stripe Connect → verification |
| 4   | Brand onboarding          | `/onboarding/brand`                                                       | Brand                          | Wizard: company → industry/size → verification                  |
| 5   | Creator dashboard         | `/dashboard`                                                              | Creator                        | Earnings, active contracts, applications, deliveries due        |
| 6   | Brand dashboard           | `/dashboard`                                                              | Brand                          | Spend, campaigns, applications received, ROI proxy              |
| 7   | Admin dashboard           | `/admin`                                                                  | Admin                          | GMV/revenue/escrow, users, verification queue, broadcast        |
| 8   | Campaign Marketplace      | `/marketplace` (+ `/campaigns/mine`)                                      | Creator browse / Brand manage  | Airbnb/Upwork: filter rail + cards + detail                     |
| 9   | Creator Asset Marketplace | `/assets` (+ `/assets/mine`)                                              | Brand browse / Creator manage  | Cards + availability calendar                                   |
| 10  | Negotiation Center        | `/negotiations` `/negotiations/:id`                                       | Both                           | Offer thread, turn indicator, counter/accept/reject             |
| 11  | Stripe Wallet             | `/wallet` (+ checkout/release/refund on `/contracts/:id`)                 | Creator wallet / Brand pay     | Mercury balance cards + ledger                                  |
| 12  | Analytics                 | `/analytics`                                                              | Role-scoped (+admin `?userId`) | Recharts cards                                                  |
| 13  | Verification              | `/verifications` (+ admin review in `/admin`)                             | Both / Admin                   | Typed request + status + audit                                  |
| 14  | Settings                  | `/settings` (profile · security · notifications · payments · appearance)  | All                            | Tabbed                                                          |

Cross-cutting components: **Notification Center** (bell popover + full `/notifications` page, live via SSE)
and **global ⌘K Search**.

---

## 7. Universal states & forms

`QueryBoundary` standardizes every data surface:

- **Loading** — skeleton matching the real layout (not a spinner).
- **Empty** — illustration + a single clear CTA.
- **Error** — message + Retry.
- **Success** — inline confirmation + sonner toast.

Forms: Zod inline validation, server 422 field-errors mapped onto fields, disabled+spinner submit state,
optimistic where safe (e.g. mark-notification-read).

---

## 8. Responsive & accessibility

- **Mobile-first.** Breakpoints `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`.
  Sidebar → off-canvas drawer `<lg`; `DataTable` → stacked cards `<md`; tap targets ≥44px.
- **WCAG 2.1 AA.** Radix supplies focus management/roles/escape. Visible emerald focus rings never removed;
  semantic landmarks; `aria-live` for toasts/notifications; body text uses emerald-600/700 (not 500) for
  contrast; full keyboard nav including ⌘K; `prefers-reduced-motion` respected.

---

## 9. Folder structure

```
web/
  app/
    (marketing)/   landing (public)
    (auth)/        login, register, forgot-password, reset-password, verify-email
    (onboarding)/  creator/, brand/ wizards
    (app)/         dashboard, campaigns, marketplace, assets, negotiations, wallet,
                   analytics, verifications, notifications, settings, admin
    layout.tsx     root: fonts, providers, theme
    globals.css    design tokens (light + dark)
  components/  ui/ · feedback/ · cards/ · data/ · forms/ · layout/ · marketing/
  lib/
    api/       client.ts · types.ts · mock/ · endpoints/ · adapter.ts
    auth/      AuthProvider · guards · role switcher (mock)
    hooks/     useDebounce, useMediaQuery, query hooks
    utils/     cn, money/date/number formatters
    config/    nav config (per role), status→variant maps, route constants
  public/
```

---

## 10. Layered build roadmap (built on user command, one layer at a time)

| Layer   | Name                       | Output you can see                                                                                                                                             |
| ------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **L0**  | Foundation & Design System | Scaffold `web/`, tokens, Geist fonts, shadcn primitives, `cn`/formatters, theme toggle, motion presets, mock API + role switcher, a `/style` kitchen-sink page |
| **L1**  | App Shell & Navigation     | Role-aware sidebar, top nav, ⌘K, notification center, responsive drawer, dark mode — navigable empty shell for all 3 roles                                     |
| **L2**  | Auth + Onboarding          | All auth pages + creator & brand wizards (mock)                                                                                                                |
| **L3**  | Landing Page               | Full marketing page                                                                                                                                            |
| **L4**  | Dashboards                 | Creator · Brand · Admin                                                                                                                                        |
| **L5**  | Marketplaces               | Campaign + Creator Asset (cards, filters, detail, calendar)                                                                                                    |
| **L6**  | Negotiation Center         | Apply flow + offer thread                                                                                                                                      |
| **L7**  | Contracts + Delivery       | Contract detail, proof upload, review                                                                                                                          |
| **L8**  | Wallet & Payments          | Balances, ledger, Connect status, checkout/release/refund                                                                                                      |
| **L9**  | Analytics (deep)           | Full chart pages                                                                                                                                               |
| **L10** | Verification + Settings    | Verification flows + all settings tabs                                                                                                                         |
| **L11** | Live Integration           | Swap mock adapter → real `/api/v1`, auth refresh, SSE, error-envelope mapping                                                                                  |

Recommended order is top-down (L0 → L11); each layer is independently demoable. Order may change once
L0/L1 exist. Each layer gets its own implementation plan + verification before being called done.

---

## 11. Out of scope (for now)

- Backend changes (this work is frontend-only against the documented API).
- Real file uploads (Cloudinary) — submission/asset/verification files use URL inputs until that slice lands.
- The Reviews module (not yet built on the backend).
- Production deployment/CI for the web app (can be a later layer).
