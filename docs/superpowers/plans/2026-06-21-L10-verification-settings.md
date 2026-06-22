# L10 — Verification + Settings Implementation Plan

> Typed verification requests + admin review queue, and a tabbed settings page.
> Gates: typecheck + lint + build + render.

**Goal:** `/verifications` — submit typed verification requests (per-type evidence)
and track status; `/admin/verifications` — review queue with approve/reject (+note).
`/settings` — tabbed: Profile, Security, Notifications (per-type in-app/email),
Payments (Connect status), Appearance (theme).

**Architecture:** Verification types + evidence fields in `lib/config/verification.ts`
(role↔type, per-type required evidence). Mock requests + endpoints. The submit
dialog is type-aware (Zod superRefine requires the selected type's evidence). Pages
mutate local state for submit/approve/reject. Settings uses shadcn Tabs; forms →
toast; notification prefs + appearance are stateful. Reuses `ConnectStatusCard`.

## Tasks

1. **Verification config + mock + endpoints** — `lib/config/verification.ts`,
   `lib/api/mock/verifications.ts`, `endpoints/verifications.ts`.
2. **Verification pieces** — `verification-request-dialog.tsx` (type-aware form),
   `verification-item.tsx` (request row + optional admin actions).
3. **Verification pages** — `/verifications` (mine + request), `/admin/verifications`
   (queue + approve/reject).
4. **Settings page** — `/settings` Tabs: Profile / Security / Notifications /
   Payments / Appearance.
5. **Verify** — typecheck + lint + build + render.
