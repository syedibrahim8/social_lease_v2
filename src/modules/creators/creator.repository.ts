import type { FilterQuery } from 'mongoose';
import { CreatorProfileModel } from '@/modules/creators/creator.model';
import type { ICreatorProfile, ICreatorProfileDocument } from '@/modules/creators/creator.types';
import type { PageParams } from '@/utils/pagination';
import type { CreateCreatorDto, UpdateCreatorDto } from '@/modules/creators/creator.validators';

/** Basic user fields surfaced when a profile is read. */
const USER_POPULATE = { path: 'userId', select: 'name email avatar role' } as const;

type CreatorFilter = FilterQuery<ICreatorProfileDocument>;
type NewCreatorProfile = CreateCreatorDto & { userId: string };

/**
 * CreatorProfileRepository — the only seam over the CreatorProfile model.
 * Reads populate the owning user's public fields so the API returns useful data
 * in one round-trip.
 */
export const creatorRepository = {
  create(data: NewCreatorProfile): Promise<ICreatorProfileDocument> {
    // Constructor accepts a loose object; Mongoose casts userId + applies defaults.
    return new CreatorProfileModel(data).save();
  },

  findById(id: string): Promise<ICreatorProfileDocument | null> {
    return CreatorProfileModel.findById(id).populate(USER_POPULATE).exec();
  },

  findByUserId(userId: string): Promise<ICreatorProfileDocument | null> {
    return CreatorProfileModel.findOne({ userId }).populate(USER_POPULATE).exec();
  },

  existsByUserId(userId: string): Promise<boolean> {
    return CreatorProfileModel.exists({ userId })
      .exec()
      .then((doc) => doc !== null);
  },

  updateByUserId(userId: string, data: UpdateCreatorDto): Promise<ICreatorProfileDocument | null> {
    return CreatorProfileModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate(USER_POPULATE)
      .exec();
  },

  deleteByUserId(userId: string): Promise<ICreatorProfileDocument | null> {
    return CreatorProfileModel.findOneAndDelete({ userId }).exec();
  },

  /**
   * Set admin-controlled verification fields. The only path that may write
   * `verificationStatus` / `profileOwnershipStatus` (blocked from owner edits) —
   * used by the verifications module on approval.
   */
  setVerification(
    userId: string,
    data: Partial<Pick<ICreatorProfile, 'verificationStatus' | 'profileOwnershipStatus'>>
  ): Promise<ICreatorProfileDocument | null> {
    return CreatorProfileModel.findOneAndUpdate({ userId }, { $set: data }, { new: true }).exec();
  },

  async list(
    filter: CreatorFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: ICreatorProfileDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      CreatorProfileModel.find(filter)
        .populate(USER_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      CreatorProfileModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

export type CreatorRepository = typeof creatorRepository;
export type { CreatorFilter };
