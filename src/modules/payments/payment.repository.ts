import { Types, type ClientSession, type FilterQuery } from 'mongoose';
import { PaymentModel } from '@/modules/payments/payment.model';
import type { IPayment, IPaymentDocument, PaymentStatus } from '@/modules/payments/payment.types';
import type { PageParams } from '@/utils/pagination';

const POPULATE = [
  { path: 'contractId', select: 'status agreedPrice' },
  { path: 'campaignId', select: 'title assetType platform' },
  { path: 'creatorId', select: 'name email avatar' },
  { path: 'brandId', select: 'name email avatar' },
];

type PaymentFilter = FilterQuery<IPaymentDocument>;
type PaymentPatch = { [K in keyof IPayment]?: IPayment[K] | undefined };

interface NewPayment {
  contractId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  amount: number;
  commissionAmount: number;
  creatorAmount: number;
  currency: string;
}

/** Fields set and counters bumped by an atomic status claim. */
interface ClaimChange {
  set?: PaymentPatch;
  unset?: (keyof IPayment)[];
  inc?: Partial<Record<'checkoutAttempt' | 'releaseAttempt' | 'refundAttempt', number>>;
}

export const paymentRepository = {
  create(data: NewPayment): Promise<IPaymentDocument> {
    return new PaymentModel({ ...data, transferGroup: `contract-${data.contractId}` }).save();
  },

  /**
   * Move a payment out of one of `from` atomically. Returns the updated document,
   * or null when the payment was not in `from` — meaning someone else already
   * moved it. Every money-moving transition goes through here; it is what makes
   * "release" and "refund" single-shot and mutually exclusive.
   */
  claim(
    id: string | Types.ObjectId,
    from: readonly PaymentStatus[],
    change: ClaimChange,
    session?: ClientSession
  ): Promise<IPaymentDocument | null> {
    const update: Record<string, unknown> = {};
    if (change.set) update.$set = change.set;
    if (change.unset?.length) {
      update.$unset = Object.fromEntries(change.unset.map((k) => [k, 1]));
    }
    if (change.inc) update.$inc = change.inc;
    return PaymentModel.findOneAndUpdate({ _id: id, status: { $in: from } }, update, {
      new: true,
      session: session ?? null,
    }).exec();
  },

  /**
   * Take the short checkout lease (bumping the attempt counter), so only one
   * request at a time can create a Checkout Session for this payment.
   */
  takeCheckoutLease(id: string, leaseMs: number): Promise<IPaymentDocument | null> {
    const now = new Date();
    return PaymentModel.findOneAndUpdate(
      {
        _id: id,
        status: 'PENDING',
        $or: [{ checkoutLockUntil: { $exists: false } }, { checkoutLockUntil: { $lt: now } }],
      },
      {
        $set: { checkoutLockUntil: new Date(now.getTime() + leaseMs) },
        $inc: { checkoutAttempt: 1 },
      },
      { new: true }
    ).exec();
  },

  /** Record the new session and drop the lease in one write. */
  setCheckoutSession(id: string, sessionId: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findOneAndUpdate(
      { _id: id, status: 'PENDING' },
      { $set: { stripeCheckoutSessionId: sessionId }, $unset: { checkoutLockUntil: 1 } },
      { new: true }
    ).exec();
  },

  releaseCheckoutLease(id: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(
      id,
      { $unset: { checkoutLockUntil: 1 } },
      { new: true }
    ).exec();
  },

  findByPaymentIntentOrCharge(
    paymentIntentId: string | undefined,
    chargeId: string | undefined
  ): Promise<IPaymentDocument | null> {
    const or: FilterQuery<IPaymentDocument>[] = [];
    if (paymentIntentId) or.push({ stripePaymentIntentId: paymentIntentId });
    if (chargeId) or.push({ stripeChargeId: chargeId });
    if (or.length === 0) return Promise.resolve(null);
    return PaymentModel.findOne({ $or: or }).exec();
  },

  /** Reconciler: PENDING payments with a session that hasn't moved for a while. */
  findStalePending(olderThan: Date, limit: number): Promise<IPaymentDocument[]> {
    return PaymentModel.find({
      status: 'PENDING',
      stripeCheckoutSessionId: { $exists: true },
      updatedAt: { $lt: olderThan },
    })
      .sort({ updatedAt: 1 })
      .limit(limit)
      .exec();
  },

  /** Reconciler: RELEASING/REFUNDING claims older than `olderThan` (interrupted). */
  findStaleClaims(
    status: 'RELEASING' | 'REFUNDING',
    olderThan: Date,
    limit: number
  ): Promise<IPaymentDocument[]> {
    return PaymentModel.find({ status, claimedAt: { $lt: olderThan } })
      .sort({ claimedAt: 1 })
      .limit(limit)
      .exec();
  },

  findById(id: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findById(id).populate(POPULATE).exec();
  },

  findDocById(id: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findById(id).exec();
  },

  findByContractId(contractId: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findOne({ contractId }).exec();
  },

  findByCheckoutSessionId(sessionId: string): Promise<IPaymentDocument | null> {
    return PaymentModel.findOne({ stripeCheckoutSessionId: sessionId }).exec();
  },

  updateById(
    id: string,
    data: PaymentPatch,
    session?: ClientSession
  ): Promise<IPaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, session: session ?? null }
    ).exec();
  },

  async list(
    filter: PaymentFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IPaymentDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      PaymentModel.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PaymentModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  /** Analytics: payment totals grouped by status (optionally scoped to a party). */
  statusBreakdown(scope: { brandId?: string; creatorId?: string } = {}): Promise<PaymentStatRow[]> {
    const match: Record<string, unknown> = {};
    if (scope.brandId) match.brandId = new Types.ObjectId(scope.brandId);
    if (scope.creatorId) match.creatorId = new Types.ObjectId(scope.creatorId);
    return PaymentModel.aggregate<PaymentStatRow>([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          commission: { $sum: '$commissionAmount' },
          creatorAmount: { $sum: '$creatorAmount' },
        },
      },
    ]);
  },
};

export interface PaymentStatRow {
  _id: PaymentStatus;
  count: number;
  amount: number;
  commission: number;
  creatorAmount: number;
}

export type PaymentRepository = typeof paymentRepository;
export type { PaymentFilter };
