# L4 — Dashboards Implementation Plan

> Creator / Brand / Admin dashboards in the app shell. Gates: typecheck + lint +
> build + render.

**Goal:** Three role dashboards rendered inside the app shell, driven by mock data
through TanStack Query (real loading skeletons), each with metric StatCards, a
themed Recharts area chart, a recent-activity list, and (admin) status/role
breakdowns.

**Architecture:** Mock dashboard payloads mirror the backend analytics shapes
(`lib/api/mock/dashboards.ts`); endpoints resolve through the mock⇄live adapter
(`lib/api/endpoints/dashboard.ts`). Each dashboard is a client component using
`useQuery` + `QueryBoundary` (skeleton/empty/error). `/dashboard` renders the
Creator or Brand dashboard by role (admins are redirected to `/admin`); `/admin`
renders the platform dashboard.

## Tasks

1. **Recharts** install + `components/dashboard/area-chart-card.tsx` (themed area
   chart with a custom tooltip, brand colors via tokens).
2. **Mock + endpoints** — `lib/api/mock/dashboards.ts` (creator/brand/admin payloads
   - types), `lib/api/endpoints/dashboard.ts` (3 getters via `resolve`).
3. **Shared pieces** — `activity-list.tsx` (StatusBadge + relative time),
   `breakdown-list.tsx` (label + count + proportion bar), `dashboard-skeleton.tsx`.
4. **Creator dashboard** — earnings (available/pending/total), conversion, delivery
   approval rate, volume chart, recent activity.
5. **Brand dashboard** — spend (net/escrow), campaign performance + completion rate,
   applications received, ROI proxy, spend chart, recent activity.
6. **Admin dashboard** — GMV, revenue, escrow, transactions; users by role; campaign
   - contract status breakdowns; GMV chart; recent activity.
7. **Pages** — `app/(app)/dashboard/page.tsx` (role switch), `app/(app)/admin/page.tsx`.
8. **Verify** — typecheck + lint + build + render.
