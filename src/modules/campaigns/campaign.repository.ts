import type { FilterQuery } from 'mongoose';
import { CampaignModel } from '@/modules/campaigns/campaign.model';
import type { ICampaign, ICampaignDocument } from '@/modules/campaigns/campaign.types';
import type { PageParams } from '@/utils/pagination';
import type { CreateCampaignDto } from '@/modules/campaigns/campaign.validators';

/** Owning brand's public fields, surfaced when a campaign is read. */
const BRAND_POPULATE = { path: 'brandId', select: 'name email avatar role' } as const;

type CampaignFilter = FilterQuery<ICampaignDocument>;
type NewCampaign = CreateCampaignDto & { brandId: string };
/** Partial update that tolerates explicit `undefined` (as Zod-parsed DTOs carry). */
type CampaignPatch = { [K in keyof ICampaign]?: ICampaign[K] | undefined };

/**
 * CampaignRepository — the only seam over the Campaign model.
 *
 * `findRawById` returns the un-populated document (so `brandId` stays an
 * ObjectId) for ownership/status guards; read paths use the populated variant.
 */
export const campaignRepository = {
  async create(data: NewCampaign): Promise<ICampaignDocument> {
    const doc = await new CampaignModel(data).save();
    return doc.populate(BRAND_POPULATE);
  },

  findById(id: string): Promise<ICampaignDocument | null> {
    return CampaignModel.findById(id).populate(BRAND_POPULATE).exec();
  },

  /** Un-populated — for ownership checks and mutations. */
  findRawById(id: string): Promise<ICampaignDocument | null> {
    return CampaignModel.findById(id).exec();
  },

  updateById(id: string, data: CampaignPatch): Promise<ICampaignDocument | null> {
    return CampaignModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .populate(BRAND_POPULATE)
      .exec();
  },

  deleteById(id: string): Promise<ICampaignDocument | null> {
    return CampaignModel.findByIdAndDelete(id).exec();
  },

  async list(
    filter: CampaignFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: ICampaignDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      CampaignModel.find(filter)
        .populate(BRAND_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      CampaignModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

export type CampaignRepository = typeof campaignRepository;
export type { CampaignFilter };
