import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { brandRepository, type BrandFilter } from '@/modules/brands/brand.repository';
import type { IBrandProfileDocument } from '@/modules/brands/brand.types';
import type {
  CreateBrandDto,
  ListBrandsQuery,
  UpdateBrandDto,
} from '@/modules/brands/brand.validators';

/**
 * Brand-profile use-cases.
 *
 * Ownership: mutating operations take the authenticated `userId` and act on the
 * company profile that belongs to it — there is no path to mutate another user's
 * company ("brands can manage only their company").
 */
export const brandService = {
  async createProfile(userId: string, dto: CreateBrandDto): Promise<IBrandProfileDocument> {
    if (await brandRepository.existsByUserId(userId)) {
      throw ApiError.conflict('You already have a company profile');
    }
    return brandRepository.create({ userId, ...dto });
  },

  async getMyProfile(userId: string): Promise<IBrandProfileDocument> {
    const profile = await brandRepository.findByUserId(userId);
    if (!profile) {
      throw ApiError.notFound('Company profile not found');
    }
    return profile;
  },

  async getProfileById(id: string): Promise<IBrandProfileDocument> {
    const profile = await brandRepository.findById(id);
    if (!profile) {
      throw ApiError.notFound('Company profile not found');
    }
    return profile;
  },

  async updateMyProfile(userId: string, dto: UpdateBrandDto): Promise<IBrandProfileDocument> {
    const updated = await brandRepository.updateByUserId(userId, dto);
    if (!updated) {
      throw ApiError.notFound('Company profile not found');
    }
    return updated;
  },

  async deleteMyProfile(userId: string): Promise<void> {
    const deleted = await brandRepository.deleteByUserId(userId);
    if (!deleted) {
      throw ApiError.notFound('Company profile not found');
    }
  },

  async listProfiles(query: ListBrandsQuery): Promise<Paginated<IBrandProfileDocument>> {
    const filter: BrandFilter = {};
    if (query.industry) filter.industry = new RegExp(escapeRegex(query.industry), 'i');
    if (query.companySize) filter.companySize = query.companySize;
    if (query.verifiedStatus) filter.verifiedStatus = query.verifiedStatus;
    if (query.search) filter.$text = { $search: query.search };

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await brandRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};

/** Escape user input before using it in a RegExp filter. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type BrandService = typeof brandService;
