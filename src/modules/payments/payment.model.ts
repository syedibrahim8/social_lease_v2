import { Schema, model } from 'mongoose';
import {
  PAYMENT_STATUSES,
  type IPaymentDocument,
  type IPaymentModel,
} from '@/modules/payments/payment.types';

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
};

const paymentSchema = new Schema<IPaymentDocument, IPaymentModel>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      unique: true,
      index: true,
    },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    creatorAmount: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    stripeCheckoutSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String, index: true },
    stripeChargeId: { type: String, index: true },
    stripeTransferId: { type: String },
    stripeRefundId: { type: String },
    transferGroup: { type: String },
    destinationAccountId: { type: String },
    checkoutAttempt: { type: Number, default: 0, min: 0 },
    releaseAttempt: { type: Number, default: 0, min: 0 },
    refundAttempt: { type: Number, default: 0, min: 0 },
    checkoutLockUntil: { type: Date },
    claimedAt: { type: Date },
    contractStatusBeforeDispute: { type: String },
    lastError: { type: String, maxlength: 500 },
    paidAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    disputedAt: { type: Date },
  },
  { timestamps: true, toJSON }
);

// Reconciler sweep: stale PENDING sessions and interrupted RELEASING/REFUNDING claims.
paymentSchema.index({ status: 1, claimedAt: 1 });
paymentSchema.index({ status: 1, updatedAt: 1 });

export const PaymentModel = model<IPaymentDocument, IPaymentModel>('Payment', paymentSchema);
