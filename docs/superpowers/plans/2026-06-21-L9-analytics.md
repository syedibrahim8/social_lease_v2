# L9 — Analytics (deep) Implementation Plan

> Role-scoped analytics page with multiple chart types. Gates: typecheck + lint +
> build + render.

**Goal:** A dedicated `/analytics` page (deeper than the L4 dashboards) that adapts
by role — KPI row, a primary time-series area chart, a bar + donut pair, and
status/role breakdowns — with a working 3m/6m time-range selector that slices the
series.

**Architecture:** Richer mock analytics per role (`lib/api/mock/analytics.ts`) +
endpoints. New themed `BarChartCard` + `DonutChartCard` (Recharts, colors from the
chart tokens via `lib/chart.ts`), reusing the L4 `AreaChartCard` + `BreakdownList`

- `StatCard`. `/analytics` picks `CreatorAnalytics` / `BrandAnalytics` /
  `PlatformAnalytics` by role; the range prop slices the time-series.

## Tasks

1. **Mock + endpoints** — `lib/api/mock/analytics.ts` (Creator/Brand/Platform
   analytics + NamedValue), `endpoints/analytics.ts`.
2. **Chart helpers** — `lib/chart.ts` (CHART_COLORS + tooltip style),
   `components/analytics/bar-chart-card.tsx`, `donut-chart-card.tsx`.
3. **Role analytics** — `creator-analytics.tsx`, `brand-analytics.tsx`,
   `platform-analytics.tsx` (KPIs + area + donut + bar + breakdown; range-aware).
4. **Page** — `/analytics` role switch + range selector.
5. **Verify** — typecheck + lint + build + render.
