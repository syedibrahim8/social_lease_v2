import type { FilterQuery } from 'mongoose';
import { PaymentModel } from '@/modules/payments/payment.model';
import type { IPayment, IPaymentDocument } from '@/modules/payments/payment.types';
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

export const paymentRepository = {
  create(data: NewPayment): Promise<IPaymentDocument> {
    return new PaymentModel(data).save();
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

  updateById(id: string, data: PaymentPatch): Promise<IPaymentDocument | null> {
    return PaymentModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
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
};

export type PaymentRepository = typeof paymentRepository;
export type { PaymentFilter };
