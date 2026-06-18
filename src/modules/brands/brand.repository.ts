import type { FilterQuery } from 'mongoose';
import { BrandProfileModel } from '@/modules/brands/brand.model';
import type { IBrandProfileDocument } from '@/modules/brands/brand.types';
import type { VerificationState } from '@/types/verification';
import type { PageParams } from '@/utils/pagination';
import type { CreateBrandDto, UpdateBrandDto } from '@/modules/brands/brand.validators';

/** Basic user fields surfaced when a profile is read. */
const USER_POPULATE = { path: 'userId', select: 'name email avatar role' } as const;

type BrandFilter = FilterQuery<IBrandProfileDocument>;
type NewBrandProfile = CreateBrandDto & { userId: string };

/**
 * BrandProfileRepository — the only seam over the BrandProfile model. Mirrors
 * the creators repository: reads populate the owning user's public fields.
 */
export const brandRepository = {
  create(data: NewBrandProfile): Promise<IBrandProfileDocument> {
    return new BrandProfileModel(data).save();
  },

  findById(id: string): Promise<IBrandProfileDocument | null> {
    return BrandProfileModel.findById(id).populate(USER_POPULATE).exec();
  },

  findByUserId(userId: string): Promise<IBrandProfileDocument | null> {
    return BrandProfileModel.findOne({ userId }).populate(USER_POPULATE).exec();
  },

  existsByUserId(userId: string): Promise<boolean> {
    return BrandProfileModel.exists({ userId })
      .exec()
      .then((doc) => doc !== null);
  },

  updateByUserId(userId: string, data: UpdateBrandDto): Promise<IBrandProfileDocument | null> {
    return BrandProfileModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate(USER_POPULATE)
      .exec();
  },

  deleteByUserId(userId: string): Promise<IBrandProfileDocument | null> {
    return BrandProfileModel.findOneAndDelete({ userId }).exec();
  },

  /**
   * Set the admin-controlled `verifiedStatus` (blocked from owner edits) — used
   * by the verifications module on approval.
   */
  setVerification(
    userId: string,
    verifiedStatus: VerificationState
  ): Promise<IBrandProfileDocument | null> {
    return BrandProfileModel.findOneAndUpdate(
      { userId },
      { $set: { verifiedStatus } },
      { new: true }
    ).exec();
  },

  async list(
    filter: BrandFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IBrandProfileDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      BrandProfileModel.find(filter)
        .populate(USER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      BrandProfileModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

export type BrandRepository = typeof brandRepository;
export type { BrandFilter };
