# L5 — Marketplaces Implementation Plan

> Campaign + Creator Asset discovery marketplaces. Gates: typecheck + lint +
> build + render.

**Goal:** Two polished discovery surfaces (Airbnb/Upwork feel) — browse campaigns
(`/marketplace`) and browse creator assets (`/assets`) — each with a filter rail,
search, a responsive card grid, empty/loading states, and a detail drawer (asset
detail includes an availability calendar). Plus owner listing grids at
`/campaigns/mine` and `/assets/mine`.

**Architecture:** Filter option lists in `lib/config/marketplace.ts`; mock
campaigns + asset listings in `lib/api/mock/marketplace.ts`; endpoints via the
adapter. Pages are client components: fetch all via TanStack Query, filter/sort
in memory, render `CampaignCard` / `AssetCard` grids, open a `Sheet` drawer for
detail. Filter rail is a left column on desktop and a `Sheet` on mobile.

## Tasks

1. **Config + mock + endpoints** — `lib/config/marketplace.ts`,
   `lib/api/mock/marketplace.ts` (Campaign + AssetListing + arrays),
   `lib/api/endpoints/marketplace.ts`.
2. **Cards** — `components/marketplace/campaign-card.tsx`, `asset-card.tsx`.
3. **Filter rail + calendar** — `filter-rail.tsx` (search + facet selects + sort,
   desktop column / mobile sheet), `availability-calendar.tsx` (read-only month grid).
4. **Detail drawers** — `campaign-detail.tsx` (terms + requirements + Apply),
   `asset-detail.tsx` (stats + calendar + contact CTA).
5. **Discovery pages** — `/marketplace`, `/assets` (grid + filters + empty/loading).
6. **Owner grids** — `/campaigns/mine`, `/assets/mine` (own items + new CTA).
7. **Verify** — typecheck + lint + build + render.
