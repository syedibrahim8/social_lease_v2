import mongoose, { type FilterQuery } from 'mongoose';
import { AssetModel } from '@/modules/assets/asset.model';
import type {
  AssetCategory,
  AvailabilityStatus,
  IAsset,
  IAssetAnalytics,
  IAssetDocument,
  IAudienceDemographics,
  MarketplaceAssetType,
} from '@/modules/assets/asset.types';
import type { Platform } from '@/modules/campaigns/campaign.types';
import type { PageParams } from '@/utils/pagination';

/** Owning creator's public fields, surfaced when an asset is read. */
const CREATOR_POPULATE = { path: 'creatorId', select: 'name email avatar role' } as const;

type AssetFilter = FilterQuery<IAssetDocument>;

/** Insert shape — ids arrive as strings (Mongoose casts to ObjectId). */
interface NewAsset {
  creatorId: string;
  assetType: MarketplaceAssetType;
  platform: Platform;
  category: AssetCategory;
  title: string;
  description: string;
  estimatedReach?: number | undefined;
  averageViews?: number | undefined;
  audienceDemographics?: IAudienceDemographics | undefined;
  availability?:
    | { status?: AvailabilityStatus | undefined; leadTimeDays?: number | undefined }
    | undefined;
}

/** Partial update that tolerates explicit `undefined` (as Zod-parsed DTOs carry). */
type AssetPatch = { [K in keyof IAsset]?: IAsset[K] | undefined };

interface CountRow {
  _id: string | null;
  count: number;
}
interface FacetShape {
  totals: { totalAssets: number; totalEstimatedReach: number; averageViews: number | null }[];
  byCategory: CountRow[];
  byPlatform: CountRow[];
  byVerificationStatus: CountRow[];
  byAvailability: CountRow[];
}

function toRecord(rows: CountRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    if (row._id !== null) out[row._id] = row.count;
  }
  return out;
}

/** AssetRepository — the only seam over the Asset model. */
export const assetRepository = {
  async create(data: NewAsset): Promise<IAssetDocument> {
    const doc = await new AssetModel(data).save();
    return doc.populate(CREATOR_POPULATE);
  },

  findById(id: string): Promise<IAssetDocument | null> {
    return AssetModel.findById(id).populate(CREATOR_POPULATE).exec();
  },

  /** Un-populated — for ownership checks and subdoc (calendar) mutations. */
  findDocById(id: string): Promise<IAssetDocument | null> {
    return AssetModel.findById(id).exec();
  },

  save(doc: IAssetDocument): Promise<IAssetDocument> {
    return doc.save();
  },

  updateById(id: string, data: AssetPatch): Promise<IAssetDocument | null> {
    return AssetModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate(CREATOR_POPULATE)
      .exec();
  },

  deleteById(id: string): Promise<IAssetDocument | null> {
    return AssetModel.findByIdAndDelete(id).exec();
  },

  async list(
    filter: AssetFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IAssetDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      AssetModel.find(filter)
        .populate(CREATOR_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      AssetModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  /** Aggregated analytics over one creator's assets. */
  async analyticsForCreator(creatorId: string): Promise<IAssetAnalytics> {
    const [facet] = await AssetModel.aggregate<FacetShape>([
      { $match: { creatorId: new mongoose.Types.ObjectId(creatorId) } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalAssets: { $sum: 1 },
                totalEstimatedReach: { $sum: '$estimatedReach' },
                averageViews: { $avg: '$averageViews' },
              },
            },
          ],
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          byPlatform: [{ $group: { _id: '$platform', count: { $sum: 1 } } }],
          byVerificationStatus: [{ $group: { _id: '$verificationStatus', count: { $sum: 1 } } }],
          byAvailability: [{ $group: { _id: '$availability.status', count: { $sum: 1 } } }],
        },
      },
    ]);

    const totals = facet?.totals[0];
    return {
      totalAssets: totals?.totalAssets ?? 0,
      totalEstimatedReach: totals?.totalEstimatedReach ?? 0,
      averageViews: Math.round(totals?.averageViews ?? 0),
      byCategory: toRecord(facet?.byCategory ?? []),
      byPlatform: toRecord(facet?.byPlatform ?? []),
      byVerificationStatus: toRecord(facet?.byVerificationStatus ?? []),
      byAvailability: toRecord(facet?.byAvailability ?? []),
    };
  },
};

export type AssetRepository = typeof assetRepository;
export type { AssetFilter };
