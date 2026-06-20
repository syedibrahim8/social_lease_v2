import { Types } from 'mongoose';
import { TransactionModel } from '@/modules/payments/transaction.model';
import type {
  ITransaction,
  ITransactionDocument,
  TransactionType,
} from '@/modules/payments/payment.types';
import type { PageParams } from '@/utils/pagination';

export const transactionRepository = {
  create(
    data: Omit<ITransaction, 'status'> & { status?: ITransaction['status'] }
  ): Promise<ITransactionDocument> {
    return new TransactionModel(data).save();
  },

  async listByUser(
    userId: string,
    { skip, limit }: PageParams
  ): Promise<{ items: ITransactionDocument[]; total: number }> {
    const filter = { userId };
    const [items, total] = await Promise.all([
      TransactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      TransactionModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  /** Analytics: ledger entries grouped by type (optionally scoped to a user). */
  typeBreakdown(userId?: string): Promise<TransactionStatRow[]> {
    return TransactionModel.aggregate<TransactionStatRow>([
      ...(userId ? [{ $match: { userId: new Types.ObjectId(userId) } }] : []),
      { $group: { _id: '$type', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]);
  },
};

export interface TransactionStatRow {
  _id: TransactionType;
  count: number;
  amount: number;
}

export type TransactionRepository = typeof transactionRepository;
