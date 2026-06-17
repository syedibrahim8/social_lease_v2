import { WalletModel } from '@/modules/payments/wallet.model';
import type { IWalletDocument } from '@/modules/payments/payment.types';

/**
 * WalletRepository — balance mutations use atomic `$inc` (never read-modify-write)
 * so concurrent webhook/release events can't clobber each other.
 */
export const walletRepository = {
  /** Get the user's wallet, creating an empty one if absent. */
  ensureForUser(userId: string, currency: string): Promise<IWalletDocument> {
    // upsert + new:true always returns a document (never null).
    return WalletModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, currency } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .orFail()
      .exec();
  },

  findByUserId(userId: string): Promise<IWalletDocument | null> {
    return WalletModel.findOne({ userId }).exec();
  },

  setStripeAccount(userId: string, stripeAccountId: string): Promise<IWalletDocument | null> {
    return WalletModel.findOneAndUpdate(
      { userId },
      { $set: { stripeAccountId } },
      { new: true }
    ).exec();
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
  creditPending(userId: string, amount: number): Promise<IWalletDocument | null> {
    return WalletModel.findOneAndUpdate(
      { userId },
      { $inc: { pendingBalance: amount } },
      { new: true }
    ).exec();
  },

  /** Escrow → released earnings (on payout). */
  release(userId: string, amount: number): Promise<IWalletDocument | null> {
    return WalletModel.findOneAndUpdate(
      { userId },
      { $inc: { pendingBalance: -amount, availableBalance: amount, totalEarned: amount } },
      { new: true }
    ).exec();
  },

  /** Reverse an escrow credit (on refund before release). */
  reversePending(userId: string, amount: number): Promise<IWalletDocument | null> {
    return WalletModel.findOneAndUpdate(
      { userId },
      { $inc: { pendingBalance: -amount } },
      { new: true }
    ).exec();
  },
};

export type WalletRepository = typeof walletRepository;
