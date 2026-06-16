import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { creatorRepository, type CreatorFilter } from '@/modules/creators/creator.repository';
import type { ICreatorProfileDocument } from '@/modules/creators/creator.types';
import type {
  CreateCreatorDto,
  ListCreatorsQuery,
  UpdateCreatorDto,
} from '@/modules/creators/creator.validators';

/**
 * Creator-profile use-cases.
 *
 * Ownership: mutating operations take the authenticated `userId` and act on the
 * profile that belongs to it. There is no code path to mutate another user's
 * profile, which is how "creators can only edit their own profile" is enforced.
 */
export const creatorService = {
  /** Create the caller's profile. One per user. */
  async createProfile(userId: string, dto: CreateCreatorDto): Promise<ICreatorProfileDocument> {
    if (await creatorRepository.existsByUserId(userId)) {
      throw ApiError.conflict('You already have a creator profile');
    }
    return creatorRepository.create({ userId, ...dto });
  },

  /** The caller's own profile. */
  async getMyProfile(userId: string): Promise<ICreatorProfileDocument> {
    const profile = await creatorRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Creator profile not found');
    }
    return profile;
  },

  /** Any profile by id (public browse / brand viewing). */
  async getProfileById(id: string): Promise<ICreatorProfileDocument> {
    const profile = await creatorRepository.findById(id);
    if (!profile) {
      throw ApiError.notFound('Creator profile not found');
    }
    return profile;
  },

  /** Update the caller's own profile. */
  async updateMyProfile(userId: string, dto: UpdateCreatorDto): Promise<ICreatorProfileDocument> {
    const updated = await creatorRepository.updateByUserId(userId, dto);
    if (!updated) {
      throw ApiError.notFound('Creator profile not found');
    }
    return updated;
  },

  /** Delete the caller's own profile. */
  async deleteMyProfile(userId: string): Promise<void> {
    const deleted = await creatorRepository.deleteByUserId(userId);
    if (!deleted) {
      throw ApiError.notFound('Creator profile not found');
    }
  },

  /** Browse profiles with filtering, search, and pagination. */
  async listProfiles(query: ListCreatorsQuery): Promise<Paginated<ICreatorProfileDocument>> {
    const filter: CreatorFilter = {};
    if (query.niche) filter.niche = new RegExp(escapeRegex(query.niche), 'i');
    if (query.location) filter.location = new RegExp(escapeRegex(query.location), 'i');
    if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
    if (query.minFollowers !== undefined) {
      filter['metrics.followers'] = { $gte: query.minFollowers };
    }
    if (query.search) filter.$text = { $search: query.search };

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await creatorRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};

/** Escape user input before using it in a RegExp filter. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type CreatorService = typeof creatorService;
