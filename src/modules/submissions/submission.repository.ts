import { Types, type FilterQuery } from 'mongoose';
import { SubmissionModel } from '@/modules/submissions/submission.model';
import {
  ACTIVE_SUBMISSION_STATUSES,
  type IDeliveryFile,
  type IDeliveryLink,
  type ISubmission,
  type ISubmissionDocument,
  type SubmissionStatus,
} from '@/modules/submissions/submission.types';
import type { PageParams } from '@/utils/pagination';

const POPULATE = [
  { path: 'campaignId', select: 'title assetType platform status' },
  { path: 'creatorId', select: 'name email avatar role' },
  { path: 'brandId', select: 'name email avatar role' },
];

type SubmissionFilter = FilterQuery<ISubmissionDocument>;

export interface SubmissionStatRow {
  _id: SubmissionStatus;
  count: number;
}

export interface DeliveredAnalytics {
  approvedCount: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

const EMPTY_DELIVERED: DeliveredAnalytics = {
  approvedCount: 0,
  impressions: 0,
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
};

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

  /** Analytics: submission counts grouped by status (scoped to a creator/brand). */
  statusBreakdown(
    scope: { creatorId?: string; brandId?: string } = {}
  ): Promise<SubmissionStatRow[]> {
    const match: Record<string, unknown> = {};
    if (scope.creatorId) match.creatorId = new Types.ObjectId(scope.creatorId);
    if (scope.brandId) match.brandId = new Types.ObjectId(scope.brandId);
    return SubmissionModel.aggregate<SubmissionStatRow>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  /** Analytics: summed self-reported performance over APPROVED deliveries. */
  async deliveredAnalytics(
    scope: { creatorId?: string; brandId?: string } = {}
  ): Promise<DeliveredAnalytics> {
    const match: Record<string, unknown> = { status: 'APPROVED' };
    if (scope.creatorId) match.creatorId = new Types.ObjectId(scope.creatorId);
    if (scope.brandId) match.brandId = new Types.ObjectId(scope.brandId);
    const [row] = await SubmissionModel.aggregate<DeliveredAnalytics>([
      { $match: match },
      {
        $group: {
          _id: null,
          approvedCount: { $sum: 1 },
          impressions: { $sum: { $ifNull: ['$analytics.impressions', 0] } },
          reach: { $sum: { $ifNull: ['$analytics.reach', 0] } },
          likes: { $sum: { $ifNull: ['$analytics.likes', 0] } },
          comments: { $sum: { $ifNull: ['$analytics.comments', 0] } },
          shares: { $sum: { $ifNull: ['$analytics.shares', 0] } },
          saves: { $sum: { $ifNull: ['$analytics.saves', 0] } },
        },
      },
    ]);
    return row ?? EMPTY_DELIVERED;
  },
};

export type SubmissionRepository = typeof submissionRepository;
export type { SubmissionFilter };
