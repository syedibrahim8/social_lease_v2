/**
 * Backend contract types, mirroring `src/modules/**\/*.types.ts`.
 *
 * MONEY IS ALWAYS INTEGER MINOR UNITS. Every field below whose name implies an
 * amount is cents, never dollars, and never a float. Format at the render edge
 * with `formatMoney` — never with arithmetic in a component.
 */

export type Role = "CREATOR" | "BRAND" | "ADMIN";

/* ── Envelopes ────────────────────────────────────────────────────────────────
   Every endpoint returns exactly one of these two shapes.                     */

export interface ApiMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** `field` is absent on errors that aren't tied to one input. */
export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ErrorBody {
  success: false;
  message: string;
  errors: ApiFieldError[];
}

/** A page of results plus its pagination meta. */
export interface Paginated<T> {
  items: T[];
  meta?: ApiMeta;
}

/* ── Auth ─────────────────────────────────────────────────────────────────── */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  provider: "LOCAL" | "GOOGLE";
  isVerified: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** The refresh token is NOT here — it is an httpOnly cookie. */
export interface Session {
  user: AuthUser;
  accessToken: string;
}

/* ── Campaign ─────────────────────────────────────────────────────────────── */

/**
 * These mirror `src/modules/campaigns/campaign.types.ts` and must stay
 * COMPLETE, not merely plausible. A missing member does not fail typecheck —
 * it fails silently at runtime as a blank badge, because the label lookup
 * returns undefined for a value the backend happily sends.
 */
export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "NEGOTIATION",
  "FUNDED",
  "IN_PROGRESS",
  "SUBMITTED",
  "APPROVED",
  "COMPLETED",
  "DISPUTED",
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
  "TWITTER_PINNED_POST",
  "TWITTER_HEADER",
  "BIO_MENTION",
  "UGC_CONTENT",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const PLATFORMS = [
  "LINKEDIN",
  "INSTAGRAM",
  "YOUTUBE",
  "TWITTER",
  "FACEBOOK",
  "TIKTOK",
  "OTHER",
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

/** The slice of a contract that payment reads populate. */
export interface ContractRef {
  id: string;
  status: ContractStatus;
  agreedPrice: number;
}

export interface Payment {
  id: string;
  /**
   * POPULATED on read into { id, status, agreedPrice } — not a bare id. Compare
   * with refId(), never with ===, or the match silently always fails.
   */
  contractId: Ref<ContractRef>;
  campaignId: Ref<CampaignRef>;
  brandId: Ref<UserRef>;
  creatorId: Ref<UserRef>;
  /** Gross, minor units — what the brand paid. */
  amount: number;
  /** Platform fee, minor units. Frozen at checkout. */
  commissionAmount: number;
  /** amount − commission, minor units. What the creator receives. */
  creatorAmount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  /** Held in escrow for contracts not yet released. Minor units. */
  pendingBalance: number;
  /** Released to the creator; lives in Stripe. Minor units. */
  availableBalance: number;
  totalEarned: number;
  stripeAccountId?: string;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

export interface ConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
}

/* ── Contract (full shape) ────────────────────────────────────────────────── */

export interface Deliverable {
  description: string;
  completed: boolean;
}

export interface Contract {
  id: string;
  applicationId: string;
  /** Populated on read, an id on write. */
  campaignId: Ref<CampaignRef>;
  brandId: Ref<UserRef>;
  creatorId: Ref<UserRef>;
  assetType: AssetType;
  platform: Platform;
  /** Minor units. The agreed price from the accepted offer. */
  agreedPrice: number;
  currency: string;
  deliverables: Deliverable[];
  timeline: { durationDays: number; startDate?: string; endDate?: string };
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Campaign ─────────────────────────────────────────────────────────────── */

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  assetType: AssetType;
  platform: Platform;
  duration: number;
  /** Minor units. */
  budgetMin: number;
  budgetMax: number;
  currency: string;
  requirements: string[];
  status: CampaignStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Applications & negotiation ───────────────────────────────────────────── */

export const APPLICATION_STATUSES = [
  "PENDING",
  "NEGOTIATING",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";

/**
 * Reads populate campaignId/creatorId/brandId into objects; writes and
 * un-populated reads leave them as ids. `refId` narrows either to a string.
 */
export type Ref<T> = string | T;

export interface UserRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: Role;
}

export interface CampaignRef {
  id: string;
  title: string;
  assetType: AssetType;
  platform: Platform;
  status: CampaignStatus;
  currency: string;
}

export function refId<T extends { id: string }>(ref: Ref<T>): string {
  return typeof ref === "string" ? ref : ref.id;
}

export function refOrNull<T extends { id: string }>(ref: Ref<T>): T | null {
  return typeof ref === "string" ? null : ref;
}

/** `sender`/`receiver` are NOT populated — they stay as user ids. */
export interface Offer {
  _id?: string;
  sender: string;
  receiver: string;
  /** Minor units. */
  amount: number;
  message?: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Application {
  id: string;
  campaignId: Ref<CampaignRef>;
  creatorId: Ref<UserRef>;
  brandId: Ref<UserRef>;
  assetType: AssetType;
  proposal: string;
  /** Minor units. */
  proposedPrice: number;
  estimatedReach: number;
  currency: string;
  status: ApplicationStatus;
  /** Set once an offer is accepted. Minor units. */
  agreedPrice?: number;
  offers: Offer[];
  createdAt: string;
  updatedAt: string;
}

/* ── Submissions (delivery) ───────────────────────────────────────────────── */

export const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUESTED",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const PROOF_FILE_TYPES = ["SCREENSHOT", "ANALYTICS_SCREENSHOT", "DOCUMENT"] as const;
export type ProofFileType = (typeof PROOF_FILE_TYPES)[number];

export interface ProofFile {
  type: ProofFileType;
  url: string;
  caption?: string;
}

export interface ProofLink {
  url: string;
  label?: string;
}

export interface SubmissionAnalytics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
}

export interface Submission {
  id: string;
  contractId: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  assetType: AssetType;
  status: SubmissionStatus;
  files: ProofFile[];
  links: ProofLink[];
  note?: string;
  analytics?: SubmissionAnalytics;
  reviewNote?: string;
  revision: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Notifications ────────────────────────────────────────────────────────── */

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels: string[];
  read: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  mutedInApp: string[];
  mutedEmail: string[];
}
