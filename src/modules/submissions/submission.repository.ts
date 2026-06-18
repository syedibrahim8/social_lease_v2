import type { FilterQuery } from 'mongoose';
import { SubmissionModel } from '@/modules/submissions/submission.model';
import {
  ACTIVE_SUBMISSION_STATUSES,
  type IDeliveryFile,
  type IDeliveryLink,
  type ISubmission,
  type ISubmissionDocument,
} from '@/modules/submissions/submission.types';
import type { PageParams } from '@/utils/pagination';

const POPULATE = [
  { path: 'campaignId', select: 'title assetType platform status' },
  { path: 'creatorId', select: 'name email avatar role' },
  { path: 'brandId', select: 'name email avatar role' },
];

type SubmissionFilter = FilterQuery<ISubmissionDocument>;

/** Insert shape — ids arrive as strings (Mongoose casts to ObjectId). */
interface NewSubmission {
  contractId: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  assetType: ISubmission['assetType'];
  platform: ISubmission['platform'];
  revision: number;
  files: IDeliveryFile[];
  links: IDeliveryLink[];
  note?: string | undefined;
  analytics?: ISubmission['analytics'] | undefined;
}

/** SubmissionRepository — the only seam over the Submission model. */
export const submissionRepository = {
  create(data: NewSubmission): Promise<ISubmissionDocument> {
    return new SubmissionModel(data).save();
  },

  findById(id: string): Promise<ISubmissionDocument | null> {
    return SubmissionModel.findById(id).populate(POPULATE).exec();
  },

  /** Un-populated — for ownership/status mutations. */
  findDocById(id: string): Promise<ISubmissionDocument | null> {
    return SubmissionModel.findById(id).exec();
  },

  save(doc: ISubmissionDocument): Promise<ISubmissionDocument> {
    return doc.save();
  },

  countByContract(contractId: string): Promise<number> {
    return SubmissionModel.countDocuments({ contractId }).exec();
  },

  /** The single active (non-terminal) delivery for a contract, if any. */
  findActiveByContract(contractId: string): Promise<ISubmissionDocument | null> {
    return SubmissionModel.findOne({
      contractId,
      status: { $in: ACTIVE_SUBMISSION_STATUSES },
    }).exec();
  },

  async list(
    filter: SubmissionFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: ISubmissionDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      SubmissionModel.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      SubmissionModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

export type SubmissionRepository = typeof submissionRepository;
export type { SubmissionFilter };
