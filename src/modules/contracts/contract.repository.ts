import type { FilterQuery } from 'mongoose';
import { ContractModel } from '@/modules/contracts/contract.model';
import type { IContract, IContractDocument } from '@/modules/contracts/contract.types';
import type { PageParams } from '@/utils/pagination';

const POPULATE = [
  { path: 'campaignId', select: 'title assetType platform status' },
  { path: 'creatorId', select: 'name email avatar role' },
  { path: 'brandId', select: 'name email avatar role' },
];

type ContractFilter = FilterQuery<IContractDocument>;

interface NewContract {
  applicationId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  assetType: IContract['assetType'];
  platform: IContract['platform'];
  agreedPrice: number;
  currency: string;
  deliverables: IContract['deliverables'];
  timeline: IContract['timeline'];
}

/** ContractRepository — the only seam over the Contract model. */
export const contractRepository = {
  create(data: NewContract): Promise<IContractDocument> {
    return new ContractModel(data).save();
  },

  findById(id: string): Promise<IContractDocument | null> {
    return ContractModel.findById(id).populate(POPULATE).exec();
  },

  /** Un-populated — for status/ownership mutations. */
  findDocById(id: string): Promise<IContractDocument | null> {
    return ContractModel.findById(id).exec();
  },

  save(doc: IContractDocument): Promise<IContractDocument> {
    return doc.save();
  },

  async list(
    filter: ContractFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IContractDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      ContractModel.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ContractModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

export type ContractRepository = typeof contractRepository;
export type { ContractFilter };
