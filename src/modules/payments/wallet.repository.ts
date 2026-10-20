import type { ClientSession } from 'mongoose';
import { WalletModel } from '@/modules/payments/wallet.model';
import type { IWalletDocument } from '@/modules/payments/payment.types';

/** Raised when a balance change would break a ledger invariant (never expected). */
export class WalletInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletInvariantError';
  }
}

/**
 * WalletRepository — balance mutations use atomic `$inc` (never read-modify-write)
 * so concurrent webhook/release events can't clobber each other. Decrements are
 * conditional on the balance covering them: a miss throws rather than letting a
 * balance go negative, which would mean money was counted twice somewhere.
 */
export const walletRepository = {
  /** Get the user's wallet, creating an empty one if absent. */
  ensureForUser(
    userId: string,
    currency: string,
    session?: ClientSession
  ): Promise<IWalletDocument> {
    // upsert + new:true always returns a document (never null).
    return WalletModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, currency: currency.toUpperCase() } },
      { new: true, upsert: true, setDefaultsOnInsert: true, session: session ?? null }
    )
      .orFail()
      .exec();
  },

  findByUserId(userId: string): Promise<IWalletDocument | null> {
    return WalletModel.findOne({ userId }).exec();
  },

  findByStripeAccountId(stripeAccountId: string): Promise<IWalletDocument | null> {
    return WalletModel.findOne({ stripeAccountId }).exec();
  },

  /**
   * Attach a connected account only if the wallet has none yet. Returns the
   * wallet as stored — if a concurrent request attached one first, that one wins.
   */
  async setStripeAccountIfMissing(
    userId: string,
    stripeAccountId: string
  ): Promise<IWalletDocument | null> {
    await WalletModel.updateOne(
      { userId, stripeAccountId: { $exists: false } },
      { $set: { stripeAccountId } }
    ).exec();
    return WalletModel.findOne({ userId }).exec();
  },

  /** Same first-writer-wins rule for a brand's Stripe Customer. */
  async setStripeCustomerIfMissing(
    userId: string,
    stripeCustomerId: string
  ): Promise<IWalletDocument | null> {
    await WalletModel.updateOne(
      { userId, stripeCustomerId: { $exists: false } },
      { $set: { stripeCustomerId } }
    ).exec();
    return WalletModel.findOne({ userId }).exec();
  },

  setOnboardingStatus(
    stripeAccountId: string,
    payoutsEnabled: boolean,
    onboardingComplete: boolean
  ): Promise<IWalletDocument | null> {
    return WalletModel.findOneAndUpdate(
      { stripeAccountId },
      { $set: { payoutsEnabled, onboardingComplete } },
      { new: true }
    ).exec();
  },

  /** Funds enter escrow for the creator (on brand payment). */
  async creditPending(userId: string, amount: number, session?: ClientSession): Promise<void> {
    const res = await WalletModel.updateOne(
      { userId },
      { $inc: { pendingBalance: amount } },
      session ? { session } : {}
    ).exec();
    if (res.matchedCount !== 1) throw new WalletInvariantError(`No wallet for user ${userId}`);
  },

  /** Escrow → released earnings (on payout). */
  async release(userId: string, amount: number, session?: ClientSession): Promise<void> {
    const res = await WalletModel.updateOne(
      { userId, pendingBalance: { $gte: amount } },
      { $inc: { pendingBalance: -amount, availableBalance: amount, totalEarned: amount } },
      session ? { session } : {}
    ).exec();
    if (res.matchedCount !== 1) {
      throw new WalletInvariantError(`Pending balance of ${userId} does not cover ${amount}`);
    }
  },

  /** Reverse an escrow credit (on refund before release). */
  async reversePending(userId: string, amount: number, session?: ClientSession): Promise<void> {
    const res = await WalletModel.updateOne(
      { userId, pendingBalance: { $gte: amount } },
      { $inc: { pendingBalance: -amount } },
      session ? { session } : {}
    ).exec();
    if (res.matchedCount !== 1) {
      throw new WalletInvariantError(`Pending balance of ${userId} does not cover ${amount}`);
    }
  },

  /** Analytics: summed balances across all creator wallets (platform-wide). */
  async platformTotals(): Promise<{
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
  }> {
    const [row] = await WalletModel.aggregate<{
      totalEarned: number;
      availableBalance: number;
      pendingBalance: number;
    }>([
      {
        $group: {
          _id: null,
          totalEarned: { $sum: '$totalEarned' },
          availableBalance: { $sum: '$availableBalance' },
          pendingBalance: { $sum: '$pendingBalance' },
        },
      },
    ]);
    return row ?? { totalEarned: 0, availableBalance: 0, pendingBalance: 0 };
  },
};

export type WalletRepository = typeof walletRepository;
