import type { Document, Model, Types } from 'mongoose';

/**
 * Payment lifecycle (escrow via separate charges & transfers):
 *   PENDING    — checkout created, brand has not paid yet
 *   PAID       — brand paid; funds held by the platform (escrow)
 *   RELEASING  — a payout Transfer is in flight (claimed; nothing else may move it)
 *   RELEASED   — transferred to the creator's connected account
 *   REFUNDING  — a refund is in flight (claimed, same as RELEASING)
 *   REFUNDED   — returned to the brand (only before release, or a lost dispute)
 *   DISPUTED   — the brand's bank opened a chargeback; escrow is frozen
 *   FAILED     — the charge could not be accepted (e.g. amount mismatch, refunded)
 *
 * RELEASING/REFUNDING are claims taken with an atomic conditional update, which
 * is what makes release and refund mutually exclusive and each single-shot.
 */
export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'RELEASING',
  'RELEASED',
  'REFUNDING',
  'REFUNDED',
  'DISPUTED',
  'FAILED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Ledger entry kinds. EARNING/PAYOUT are the creator's side of a contract;
 * SPEND is the brand's side of funding it. REFUND appears on both sides — the
 * creator's escrow credit is reversed while the brand's charge comes back.
 */
export const TRANSACTION_TYPES = ['EARNING', 'PAYOUT', 'REFUND', 'SPEND'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/** A payment for a single contract (escrow + payout record). */
export interface IPayment {
  contractId: Types.ObjectId;
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  amount: number; // gross, minor units
  commissionAmount: number; // platform fee, minor units
  creatorAmount: number; // amount - commission, minor units
  currency: string;
  status: PaymentStatus;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  /** The funding charge; payouts use it as `source_transaction`. */
  stripeChargeId?: string;
  stripeTransferId?: string;
  stripeRefundId?: string;
  /** `contract-{contractId}`, shared by the charge and the payout Transfer. */
  transferGroup?: string;
  /** The connected account the payout was sent to, recorded when it is claimed. */
  destinationAccountId?: string;
  /** Attempt counters feed the Stripe idempotency keys (one key per attempt). */
  checkoutAttempt: number;
  releaseAttempt: number;
  refundAttempt: number;
  /** Short lease that stops two requests creating checkout sessions at once. */
  checkoutLockUntil?: Date;
  /** When the current RELEASING/REFUNDING claim was taken (reconciler input). */
  claimedAt?: Date;
  /** Contract status to restore if a dispute is decided in the platform's favour. */
  contractStatusBeforeDispute?: string;
  lastError?: string;
  paidAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  disputedAt?: Date;
}

export interface IPaymentDocument extends IPayment, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type IPaymentModel = Model<IPaymentDocument>;

/** A creator's wallet — mirrors escrow state + holds their connected account. */
export interface IWallet {
  userId: Types.ObjectId;
  currency: string;
  pendingBalance: number; // held in escrow for not-yet-released contracts
  availableBalance: number; // released to the creator (lives in Stripe)
  totalEarned: number;
  stripeAccountId?: string;
  /** Brands: the Stripe Customer every checkout for this brand is bound to. */
  stripeCustomerId?: string;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
}

export interface IWalletDocument extends IWallet, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type IWalletModel = Model<IWalletDocument>;

/** An immutable ledger entry recording a money movement for a user. */
export interface ITransaction {
  userId: Types.ObjectId;
  paymentId: Types.ObjectId;
  contractId: Types.ObjectId;
  type: TransactionType;
  amount: number; // minor units
  currency: string;
  status: TransactionStatus;
  description: string;
}

export interface ITransactionDocument extends ITransaction, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type ITransactionModel = Model<ITransactionDocument>;
