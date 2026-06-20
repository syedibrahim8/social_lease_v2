# Creator Asset Marketplace — Web

Frontend for the Creator Asset Marketplace. A self-contained **Next.js 16** (App
Router, React 19) app that talks to the Express/Mongo backend in the parent repo
(`/api/v1`). Built layer-by-layer; this is **Layer 0 — Foundation & Design System**.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000  → visit /style for the design system
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm build        # production build
```

> Uses **pnpm** (never npm/yarn). This app has its own `package.json`/lockfile and
> is independent of the backend's tooling.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind v4 (CSS-token config) ·
shadcn/ui on **Radix** (owned in `components/ui`) · Framer Motion · TanStack Query ·
Zustand · react-hook-form + Zod · next-themes · sonner · lucide-react · date-fns.
Geist / Geist Mono via `next/font` (self-hosted).

## Design tokens

All theme-aware values are CSS variables in [`app/globals.css`](app/globals.css),
mapped to Tailwind utilities via `@theme inline`. **Dark mode** is the `.dark` class
on `<html>` (next-themes) — every token flips automatically.

- **Surfaces:** `background` `card` `muted` `border` `foreground` `muted-foreground`
- **Brand (emerald):** `bg-brand` (fill) · `text-brand-text` (accessible text) ·
  `bg-brand-muted` (tint) · scale `brand-50…700`
- **Status tones:** `success` `warning` `danger` `info`, each with `-muted` (badge bg)
  and `-text` (readable on tint)
- **Radii:** `sm 6 · md 8 · lg 10 · xl 12 · 2xl 16` · **Shadows:** soft `xs→lg`
- **Focus ring:** emerald, never removed · **Money/IDs:** `.tabular` (Geist Mono + tabular-nums)

## Layout

```
app/
  layout.tsx        fonts + providers (theme · query · mock-auth · tooltip · toaster)
  globals.css       design tokens (light + dark)
  page.tsx          holding page → /style
  style/            kitchen-sink page rendering the whole system
components/
  ui/               shadcn primitives (owned, Radix)
  feedback/         EmptyState · ErrorState · QueryBoundary
  cards/            StatCard
  data/             StatusBadge
  layout/           ThemeToggle
  providers/        theme-provider · query-provider
lib/
  utils.ts          cn()
  format.ts         money (minor units) / number / date formatters
  motion.ts         fade · slideUp · scaleIn presets (reduced-motion aware)
  config/           status-maps (every backend enum → label + tone)
  store/            ui-store (zustand: sidebar, command menu)
  auth/             mock AuthProvider + role switcher (CREATOR/BRAND/ADMIN)
  api/              client · types · adapter (mock⇄live) · mock/ · endpoints/
```

## Mock ⇄ live data

The whole UI is buildable with no backend. Every endpoint routes through
[`lib/api/adapter.ts`](lib/api/adapter.ts) `resolve(mock, live)`; while
`NEXT_PUBLIC_USE_MOCK` is not `"false"` it returns seeded data. The L11 live layer
flips that flag and the same calls hit `/api/v1` via `lib/api/client.ts`
(`NEXT_PUBLIC_API_URL`, default `http://localhost:8080/api/v1`).

## Conventions

- New status enums → add to `lib/config/status-maps.ts`; render with `<StatusBadge>`.
- Money is **integer minor units (cents)** everywhere; format with `formatMoney`.
- Wrap data views in `<QueryBoundary>` for consistent loading/empty/error/success.
- Animations: fade/slide/scale only, subtle, reduced-motion aware.

## Roadmap

See the design spec and plan in the parent repo:
`docs/superpowers/specs/2026-06-19-creator-marketplace-frontend-design.md` ·
`docs/superpowers/plans/2026-06-19-L0-foundation-design-system.md`.
Layers L0→L11; built one at a time on request.
