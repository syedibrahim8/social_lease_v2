import type { Document, Model, Types } from 'mongoose';

/**
 * Payment lifecycle (escrow via separate charges & transfers):
 *   PENDING   — checkout created, brand has not paid yet
 *   PAID      — brand paid; funds held by the platform (escrow)
 *   RELEASED  — transferred to the creator's connected account
 *   REFUNDED  — refunded to the brand (only before release)
 *   FAILED    — the charge failed
 */
export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'RELEASED', 'REFUNDED', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const TRANSACTION_TYPES = ['EARNING', 'PAYOUT', 'REFUND'] as const;
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
  stripeTransferId?: string;
  stripeRefundId?: string;
  paidAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
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
