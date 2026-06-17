import { Schema, model } from 'mongoose';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type ITransactionDocument,
  type ITransactionModel,
} from '@/modules/payments/payment.types';

const transactionSchema = new Schema<ITransactionDocument, ITransactionModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    status: { type: String, enum: TRANSACTION_STATUSES, default: 'COMPLETED', required: true },
    description: { type: String, required: true, trim: true, maxlength: 280 },
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

transactionSchema.index({ userId: 1, createdAt: -1 });

export const TransactionModel = model<ITransactionDocument, ITransactionModel>(
  'Transaction',
  transactionSchema
);
