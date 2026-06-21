# L7 — Contracts + Delivery Implementation Plan

> Contracts list + contract detail with the embedded delivery (proof submission +
> review) flow. Gates: typecheck + lint + build + render.

**Goal:** A contracts list (`/contracts`) and a contract detail (`/contracts/[id]`)
showing terms, a deliverables checklist, timeline, parties, and status — plus the
delivery panel: creators submit typed proof (DRAFT → SUBMITTED), brands review
(Approve → payout / Request revision / Reject). Add "Contracts" to creator + brand nav.

**Architecture:** Mock contracts each carry an embedded `submission` (the active
delivery). Endpoints via the adapter. The detail page seeds local state from the
query and mutates it on actions to demonstrate the full lifecycle. The delivery
panel renders different UI per contract status + role. Proof uses URL inputs
(typed items: Screenshot / Analytics / Document / Link) until real uploads land.

## Tasks

1. **Config + mock + endpoints** — `lib/config/contracts.ts` (PROOF_TYPES),
   `lib/api/mock/contracts.ts` (Contract + Submission + array), `endpoints/contracts.ts`.
2. **Nav** — add Contracts to creator + brand sidebar (`lib/config/nav.ts`).
3. **Pieces** — `deliverables-list.tsx` (checklist), `proof-display.tsx` (read-only
   proof), `proof-form.tsx` (useFieldArray: typed proof items + note).
4. **Delivery panel** — `delivery-panel.tsx` (status/role-aware: submit / awaiting /
   review actions / terminal banners).
5. **List page** — `/contracts` (rows: campaign, counterparty, agreed price, status,
   filter).
6. **Detail page** — `/contracts/[id]` (terms + deliverables + timeline + delivery panel
   with submit/approve/reject/request-revision/cancel handlers).
7. **Verify** — typecheck + lint + build + render.
