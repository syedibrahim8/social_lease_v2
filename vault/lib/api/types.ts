/**
 * Backend contract types, mirroring `src/modules/**\/*.types.ts`.
 *
 * MONEY IS ALWAYS INTEGER MINOR UNITS. Every field below whose name implies an
 * amount is cents, never dollars, and never a float. Format at the render edge
 * with `formatMoney` — never with arithmetic in a component.
 */

export type Role = "CREATOR" | "BRAND" | "ADMIN";

/* ── Campaign ─────────────────────────────────────────────────────────────── */

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "NEGOTIATION",
  "FUNDED",
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const ASSET_TYPES = [
  "LINKEDIN_BANNER",
  "LINKEDIN_POST",
  "INSTAGRAM_REEL",
  "INSTAGRAM_STORY",
  "YOUTUBE_SHORT",
  "YOUTUBE_VIDEO",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const PLATFORMS = [
  "LINKEDIN",
  "INSTAGRAM",
  "YOUTUBE",
  "TWITTER",
  "FACEBOOK",
  "TIKTOK",
] as const;
export type Platform = (typeof PLATFORMS)[number];

/* ── Contract ─────────────────────────────────────────────────────────────── */

export const CONTRACT_STATUSES = [
  "PENDING_FUNDING",
  "FUNDED",
  "IN_PROGRESS",
  "SUBMITTED",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

/* ── Payments ─────────────────────────────────────────────────────────────── */

export const PAYMENT_STATUSES = ["PENDING", "PAID", "RELEASED", "REFUNDED", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * SPEND is the brand's side of funding a contract; it was added to the backend
 * alongside the brand ledger. Creator rows carry `creatorAmount`, brand rows
 * carry the gross `amount`, so the two sides differ by the platform commission.
 */
export const TRANSACTION_TYPES = ["EARNING", "PAYOUT", "REFUND", "SPEND"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface Transaction {
  id: string;
  userId: string;
  paymentId: string;
  contractId: string;
  type: TransactionType;
  /** Minor units. Negative for money leaving the user. */
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  description: string;
  createdAt: string;
}
