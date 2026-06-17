import { Schema, model } from 'mongoose';
import type { IWalletDocument, IWalletModel } from '@/modules/payments/payment.types';

const walletSchema = new Schema<IWalletDocument, IWalletModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    pendingBalance: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    stripeAccountId: { type: String, index: true },
    payoutsEnabled: { type: Boolean, default: false },
    onboardingComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

export const WalletModel = model<IWalletDocument, IWalletModel>('Wallet', walletSchema);
