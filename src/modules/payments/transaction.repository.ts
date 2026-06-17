import { TransactionModel } from '@/modules/payments/transaction.model';
import type { ITransaction, ITransactionDocument } from '@/modules/payments/payment.types';
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
};

export type TransactionRepository = typeof transactionRepository;
