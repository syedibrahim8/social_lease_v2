# L6 — Negotiation Center Implementation Plan

> Negotiations list + turn-based offer thread + apply flow. Gates: typecheck +
> lint + build + render.

**Goal:** A negotiation list (`/negotiations`) and a chat-style, turn-based offer
thread (`/negotiations/[id]`) with Accept / Counter / Reject / Withdraw gated by
whose turn it is, plus an Apply dialog (proposed price + message) launched from the
campaign detail drawer.

**Architecture:** Mock negotiations with an embedded `offers[]` thread
(`lib/api/mock/negotiations.ts`) + endpoints. The detail page seeds local state
from the query and mutates it on actions (counter pushes a PENDING offer and marks
the prior COUNTERED; accept/reject/withdraw set terminal status) to demonstrate the
flow. Turn logic: the latest PENDING offer's receiver may act; the sender waits.
Role comes from `useAuth`.

## Tasks

1. **Mock + endpoints** — `negotiations.ts` (Offer/Negotiation types + array),
   `endpoints/negotiations.ts` (`getNegotiations`, `getNegotiation`).
2. **Offer thread** — `offer-thread.tsx` (timeline of offer bubbles aligned by
   sender, amount + message + status + time).
3. **Actions** — `negotiation-actions.tsx` (turn-aware Accept/Counter/Reject/Withdraw
   - counter dialog).
4. **Apply dialog** — `apply-dialog.tsx` (proposed price + message), wired into
   `campaign-detail.tsx`.
5. **List page** — `/negotiations` (rows: campaign, counterparty, latest amount,
   status, "your turn" indicator; status filter).
6. **Detail page** — `/negotiations/[id]` (context header + thread + actions).
7. **Verify** — typecheck + lint + build + render.
