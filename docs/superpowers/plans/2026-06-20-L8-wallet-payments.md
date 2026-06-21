# L8 — Wallet & Payments Implementation Plan

> Role-aware wallet + transaction ledger + Stripe Connect status + refund action.
> Gates: typecheck + lint + build + render.

**Goal:** A `/wallet` page that adapts by role — creators see Connect status,
balances (available / escrow / total earned), a payout action, and an
earnings/payout ledger; brands see spend (funded / escrow / refunded / net) and a
charges/refunds ledger. Plus a brand Refund action on the contract delivery panel
(pre-release), completing checkout → release → refund.

**Architecture:** Mock wallet summaries + transactions (`lib/api/mock/wallet.ts`) +
endpoints. Reusable `ToneBadge` for transaction types; `StatusBadge domain=payment`
for tx status. Wallet page picks `CreatorWallet` / `BrandWallet` by role (each its
own query + skeleton). Refund threads a new `onRefund` handler into `DeliveryPanel`.

## Tasks

1. **Config + mock + endpoints** — `lib/config/transactions.ts` (type→tone),
   `lib/api/mock/wallet.ts` (CreatorWallet/BrandWallet/Transaction + data),
   `endpoints/wallet.ts`.
2. **ToneBadge** — `components/data/tone-badge.tsx` (generic tone pill).
3. **Pieces** — `connect-status-card.tsx` (onboard demo), `transactions-table.tsx`.
4. **Role wallets** — `creator-wallet.tsx`, `brand-wallet.tsx`; `/wallet` role switch.
5. **Refund on contract** — add `onRefund` to `DeliveryPanel` (brand pre-release) +
   handler in the contract detail page.
6. **Verify** — typecheck + lint + build + render.
