import { Types, type FilterQuery } from 'mongoose';
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

  /** Completed-contract counts per creator (recommendation "previous success"). */
  async countCompletedByCreators(creatorIds: string[]): Promise<Map<string, number>> {
    if (creatorIds.length === 0) return new Map();
    const ids = creatorIds.map((id) => new Types.ObjectId(id));
    const rows = await ContractModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { creatorId: { $in: ids }, status: 'COMPLETED' } },
      { $group: { _id: '$creatorId', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((row) => [row._id.toString(), row.count]));
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
