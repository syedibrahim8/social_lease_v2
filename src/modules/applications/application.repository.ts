import { Types, type FilterQuery } from 'mongoose';
import { ApplicationModel } from '@/modules/applications/application.model';
import type { AssetType } from '@/modules/campaigns/campaign.types';
import type {
  ApplicationStatus,
  IApplicationDocument,
} from '@/modules/applications/application.types';
import type { PageParams } from '@/utils/pagination';

const POPULATE = [
  { path: 'campaignId', select: 'title assetType platform status currency' },
  { path: 'creatorId', select: 'name email avatar role' },
  { path: 'brandId', select: 'name email avatar role' },
];

type ApplicationFilter = FilterQuery<IApplicationDocument>;

interface NewApplication {
  campaignId: string;
  brandId: string;
  creatorId: string;
  assetType: AssetType;
  proposal: string;
  proposedPrice: number;
  estimatedReach: number;
  currency: string;
  offers: Array<{ sender: string; receiver: string; amount: number; message?: string }>;
}

/**
 * ApplicationRepository — the only seam over the Application model.
 *
 * `findDocById` returns the un-populated Mongoose document so the service can
 * mutate the embedded offer thread and `save()`; read paths use the populated
 * variant.
 */
export const applicationRepository = {
  create(data: NewApplication): Promise<IApplicationDocument> {
    return new ApplicationModel(data).save();
  },

  save(doc: IApplicationDocument): Promise<IApplicationDocument> {
    return doc.save();
  },

  findById(id: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findById(id).populate(POPULATE).exec();
  },

  /** Un-populated — for mutations (offer thread) and ownership/turn checks. */
  findDocById(id: string): Promise<IApplicationDocument | null> {
    return ApplicationModel.findById(id).exec();
  },

  existsForCampaignAndCreator(campaignId: string, creatorId: string): Promise<boolean> {
    return ApplicationModel.exists({ campaignId, creatorId })
      .exec()
      .then((doc) => doc !== null);
  },

  /** Is the creator's asset already committed (accepted) somewhere? */
  findAcceptedByCreatorAsset(
    creatorId: string,
    assetType: AssetType
  ): Promise<IApplicationDocument | null> {
    return ApplicationModel.findOne({ creatorId, assetType, status: 'ACCEPTED' }).exec();
  },

  /** Auto-reject the creator's OTHER active applications for the same asset. */
  rejectOtherActiveForAsset(
    creatorId: string,
    assetType: AssetType,
    exceptId: string
  ): Promise<unknown> {
    return ApplicationModel.updateMany(
      { creatorId, assetType, _id: { $ne: exceptId }, status: { $in: ['PENDING', 'NEGOTIATING'] } },
      { $set: { status: 'REJECTED' } }
    ).exec();
  },

  /** Auto-reject OTHER applicants to the same campaign once one is accepted. */
  rejectOtherApplicantsForCampaign(campaignId: string, exceptId: string): Promise<unknown> {
    return ApplicationModel.updateMany(
      { campaignId, _id: { $ne: exceptId }, status: { $in: ['PENDING', 'NEGOTIATING'] } },
      { $set: { status: 'REJECTED' } }
    ).exec();
  },

  async list(
    filter: ApplicationFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IApplicationDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      ApplicationModel.find(filter)
        .populate(POPULATE)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ApplicationModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  /** Analytics: application counts grouped by status (scoped to a creator/brand). */
  statusBreakdown(
    scope: { creatorId?: string; brandId?: string } = {}
  ): Promise<ApplicationStatRow[]> {
    const match: Record<string, unknown> = {};
    if (scope.creatorId) match.creatorId = new Types.ObjectId(scope.creatorId);
    if (scope.brandId) match.brandId = new Types.ObjectId(scope.brandId);
    return ApplicationModel.aggregate<ApplicationStatRow>([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },
};

export interface ApplicationStatRow {
  _id: ApplicationStatus;
  count: number;
}

export type ApplicationRepository = typeof applicationRepository;
export type { ApplicationFilter };
