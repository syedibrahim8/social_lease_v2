# L0 — Foundation & Design System Implementation Plan

> **For agentic workers:** Implement task-by-task. Verification gates replace unit tests for this
> visual/scaffolding layer, matching this repo's working agreement (typecheck + lint + build + a real
> render round-trip). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stand up the `web/` Next.js 15 app with the full design-system foundation — tokens, fonts,
themed shadcn primitives, providers, mock API seam, and a `/style` kitchen-sink page that renders the
entire system in light + dark.

**Architecture:** Self-contained Next.js 15 (App Router) app at `web/`. CSS-variable design tokens in
`globals.css` (light + dark) consumed by Tailwind v4. shadcn/ui primitives owned in `components/ui`,
re-themed to tokens. Providers (theme/query/toast/mock-auth) wrap the root. A single swappable
`lib/api` adapter (mock now, live later). Everything is provable on the `/style` page.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind v4, shadcn/ui (Radix), lucide-react,
Framer Motion, TanStack Query, Zustand, react-hook-form + Zod, Recharts, next-themes, sonner,
geist (font), date-fns, clsx + tailwind-merge + cva.

## Global Constraints

- Package manager: **pnpm** (never npm/yarn). The `web/` app has its OWN `package.json`/lockfile.
- Backend is untouched. Frontend-only. API base is `/api/v1`; money is integer **minor units (cents)**.
- Tokens are CSS variables; dark mode is a `class` on `<html>` (next-themes). Tokens come verbatim from
  the design spec (`docs/superpowers/specs/2026-06-19-creator-marketplace-frontend-design.md`).
- Accent text uses emerald-600/700 (not 500) for WCAG AA. Focus rings never removed.
- Animations: fade/slide/scale only, gated behind `prefers-reduced-motion`.
- Money/IDs render in Geist Mono with `tabular-nums`.

---

### Task 1: Scaffold the Next.js app at `web/`

**Files:** Create `web/` via `create-next-app` (App Router, TS, Tailwind, ESLint, src-less, `@/*` alias).
Then prune the boilerplate home page.

- [ ] Run `pnpm create next-app@latest web --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm` (non-interactive).
- [ ] Confirm Tailwind v4 (`@import "tailwindcss"` in `globals.css`); if scaffold used v3, that's acceptable — note which.
- [ ] Replace `app/page.tsx` with a minimal placeholder linking to `/style`.
- [ ] **Gate:** `cd web && pnpm typecheck` (add the script) and `pnpm build` pass; `pnpm dev` boots on :3000.

### Task 2: Install design-system dependencies

**Files:** `web/package.json`.

- [ ] Add runtime deps: `class-variance-authority clsx tailwind-merge lucide-react framer-motion @tanstack/react-query zustand react-hook-form zod @hookform/resolvers recharts next-themes sonner geist date-fns @radix-ui/react-*` (the primitives shadcn needs).
- [ ] **Gate:** `pnpm install` clean; `pnpm typecheck` still passes.

### Task 3: Design tokens in `globals.css`

**Files:** `web/app/globals.css`.

- [ ] Define `:root` CSS variables for the full neutral scale, accent (emerald 50/500/600/700 + dark accent), semantic colors + `-subtle` tints, and surface roles (background/card/border/muted/foreground/muted-foreground) — light values.
- [ ] Define `.dark` overrides for surface roles + accent text per the spec's dark column.
- [ ] Add radius, shadow (xs/sm/md/lg), and font-family variables.
- [ ] Map variables to Tailwind via `@theme inline` (v4) so `bg-background`, `text-foreground`, `border-border`, `bg-accent`, `text-muted-foreground`, `rounded-xl`, `shadow-sm`, etc. resolve.
- [ ] Base layer: `body { background; color; font-sans }`, focus-visible ring (2px emerald + offset), `tabular-nums` utility.
- [ ] **Gate:** `pnpm build` passes; a temporary swatch on `/` shows correct colors in both themes.

### Task 4: Fonts (Geist + Geist Mono)

**Files:** `web/app/layout.tsx`.

- [ ] Import `GeistSans` and `GeistMono` from the `geist/font` package; set `--font-sans` / `--font-mono` on `<html>`.
- [ ] Wire the font variables into the `@theme` font tokens from Task 3.
- [ ] **Gate:** headings render in Geist; a mono money sample renders in Geist Mono.

### Task 5: Core utilities — `cn` + formatters

**Files:** Create `web/lib/utils/cn.ts`, `web/lib/utils/format.ts`.

- [ ] `cn(...)` = `twMerge(clsx(...))`.
- [ ] `formatMoney(minor, currency)` (minor units → localized currency), `formatNumber`, `formatDate`, `formatRelative` (date-fns), `formatCompact` (e.g. 12.3k followers).
- [ ] **Gate:** `pnpm typecheck` passes; quick console/temporary render shows `formatMoney(123456,'USD') === "$1,234.56"`.

### Task 6: Providers + root layout

**Files:** Create `web/components/providers/theme-provider.tsx`, `query-provider.tsx`, `web/lib/auth/auth-provider.tsx` (mock + role switcher), `web/lib/store/ui-store.ts` (zustand). Modify `web/app/layout.tsx`.

- [ ] ThemeProvider (next-themes, `attribute="class"`, defaultTheme system, no flash).
- [ ] QueryProvider (TanStack `QueryClient` with sane defaults).
- [ ] Mock `AuthProvider`: holds `{ user, role, setRole }`, seeds a fake Creator/Brand/Admin; exposes a role switcher hook.
- [ ] `ui-store`: sidebar collapsed, command-menu open, etc.
- [ ] Root layout wraps children in providers + mounts `<Toaster />` (sonner).
- [ ] **Gate:** `pnpm build` passes; theme persists across reload.

### Task 7: shadcn init + owned primitives

**Files:** `web/components.json`, `web/components/ui/*`.

- [ ] `pnpm dlx shadcn@latest init` pointed at our tokens (neutral base, CSS variables on).
- [ ] Add primitives: button, input, label, textarea, select, checkbox, switch, badge, avatar, card, dialog, sheet, dropdown-menu, popover, tooltip, tabs, table, skeleton, separator, sonner, command.
- [ ] Re-theme `button` variants to our system: `primary` (gray-900 / dark white), `accent` (emerald-600), `outline`, `ghost`, `destructive`, `link`; sizes sm/md/lg/icon; loading state (spinner + disabled).
- [ ] Ensure every interactive primitive shows the emerald focus ring and works in dark mode.
- [ ] **Gate:** `pnpm typecheck` + `pnpm build` pass.

### Task 8: Motion presets

**Files:** Create `web/lib/motion.ts`.

- [ ] Export `fade`, `slideUp`, `scaleIn` variants + a shared `transition` (durations 120/180/240ms, easing `cubic-bezier(.16,1,.3,1)`).
- [ ] Respect `prefers-reduced-motion` (a `useReducedMotion`-aware helper or variants that no-op).
- [ ] **Gate:** `pnpm typecheck` passes.

### Task 9: Mock API seam

**Files:** Create `web/lib/api/client.ts`, `types.ts`, `adapter.ts`, `mock/index.ts`, `endpoints/health.ts`.

- [ ] `client.ts`: typed `fetch` wrapper that understands the backend envelopes (`{success,data,meta}` / `{success,errors}`), base URL from env, credentials include. Live path only used later.
- [ ] `adapter.ts`: `USE_MOCK` flag (env). When true, endpoints resolve from `mock/`.
- [ ] `types.ts`: seed the shared DTOs we already know (User, Role enum, pagination `meta`, status enums for StatusBadge). Expand per later layer.
- [ ] One worked endpoint (`health`/`me`) proving mock→live swap is a one-line flip.
- [ ] **Gate:** `pnpm typecheck` passes.

### Task 10: Design-system domain pieces

**Files:** Create `web/components/data/status-badge.tsx`, `web/components/cards/stat-card.tsx`, `web/components/feedback/{empty-state,error-state,query-boundary}.tsx`, `web/lib/config/status-maps.ts`.

- [ ] `status-maps.ts`: map EVERY backend status enum (campaign/application/offer/contract/payment/submission/verification) → `{ label, variant }` (variant ∈ neutral/accent/success/warning/danger/info).
- [ ] `StatusBadge`: renders a badge from a status + domain, colored via the map.
- [ ] `StatCard`: label + big tabular-mono value + optional delta (▲/▼ with success/danger) — Mercury/Stripe metric card.
- [ ] `EmptyState`, `ErrorState` (with retry), `QueryBoundary` (TanStack state → skeleton/empty/error/children).
- [ ] **Gate:** `pnpm typecheck` + `pnpm build` pass.

### Task 11: `/style` kitchen-sink page (the visible deliverable)

**Files:** Create `web/app/(marketing)/style/page.tsx` (or `web/app/style/page.tsx`), plus a small section layout.

- [ ] Sections: color tokens (neutral scale + accent + semantic swatches w/ hex), typography scale (Geist + mono money samples), spacing/radii/shadow specimens.
- [ ] Buttons: every variant × size × state (default/hover/disabled/loading).
- [ ] Inputs/forms: input, textarea, select, checkbox, switch, with a Zod-validated demo field showing error state.
- [ ] Badges: all `StatusBadge` variants across domains; semantic badges.
- [ ] Overlays: dialog, sheet (drawer), dropdown-menu, popover, tooltip, command (⌘K) demo.
- [ ] Data: a small `table` + `skeleton` + `EmptyState` + `ErrorState` + `StatCard` row.
- [ ] A floating theme toggle so the whole page can be viewed light/dark.
- [ ] Subtle Framer Motion section reveals (fade/slideUp).
- [ ] **Gate:** `pnpm dev` → `/style` renders every section correctly in BOTH themes; keyboard focus rings visible; `pnpm typecheck && pnpm lint && pnpm build` all pass.

### Task 12: README + final verification

**Files:** Create `web/README.md`.

- [ ] Document: how to run (`pnpm install`, `pnpm dev`), the token system, where primitives live, the mock→live API flip, and the layer roadmap pointer.
- [ ] **Gate (L0 done):** `cd web && pnpm typecheck && pnpm lint && pnpm build` all green; `/style` verified in light + dark; screenshot/confirm the render.

---

## Self-Review

- **Spec coverage:** L0 row of the roadmap (scaffold, tokens, Geist fonts, shadcn primitives, cn/formatters,
  theme toggle, motion presets, mock API + role switcher, `/style` page) — every item maps to a task above.
  Design-system sections (color/type/spacing/radii/shadow, component tiers `ui`/`feedback`/`cards`/`data`)
  are all exercised on `/style`. ✔
- **Placeholder scan:** none — gates are concrete commands; token values come from the spec verbatim. ✔
- **Type consistency:** `cn`, `formatMoney`, `StatusBadge`, `StatCard`, `QueryBoundary`, `USE_MOCK` are named
  consistently across tasks. ✔
- **Scope:** single, self-contained, demoable layer. ✔
