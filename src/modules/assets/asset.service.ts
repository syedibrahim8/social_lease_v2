import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { assetRepository, type AssetFilter } from '@/modules/assets/asset.repository';
import {
  ASSET_TYPE_CATEGORY,
  ASSET_TYPE_PLATFORM,
  type IAssetAnalytics,
  type IAssetDocument,
  type IAvailability,
  type MarketplaceAssetType,
} from '@/modules/assets/asset.types';
import type { Platform } from '@/modules/campaigns/campaign.types';
import type {
  AvailabilityBlockDto,
  CreateAssetDto,
  ListAssetsQuery,
  UpdateAssetDto,
} from '@/modules/assets/asset.validators';

type AssetPatch = Parameters<typeof assetRepository.updateById>[1];

/** A type-locked asset must be listed on its canonical platform; UGC is flexible. */
function assertPlatformForType(assetType: MarketplaceAssetType, platform: Platform): void {
  const canonical = ASSET_TYPE_PLATFORM[assetType];
  if (canonical && platform !== canonical) {
    throw ApiError.badRequest(`A ${assetType} must be listed on ${canonical}`);
  }
}

function buildFilter(query: ListAssetsQuery): AssetFilter {
  const filter: Record<string, unknown> = {};
  if (query.search) filter.$text = { $search: query.search };
  if (query.category) filter.category = query.category;
  if (query.assetType) filter.assetType = query.assetType;
  if (query.platform) filter.platform = query.platform;
  if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
  if (query.availabilityStatus) filter['availability.status'] = query.availabilityStatus;
  if (query.creatorId) filter.creatorId = query.creatorId;
  if (query.minReach !== undefined) filter.estimatedReach = { $gte: query.minReach };
  if (query.minViews !== undefined) filter.averageViews = { $gte: query.minViews };
  return filter;
}

/**
 * Asset marketplace use-cases.
 *
 * Assets are a creator-owned COLLECTION (a creator lists many), so mutations use
 * per-asset ownership (`loadOwned` → 403), mirroring campaigns. `category` is
 * derived from `assetType`; `verificationStatus` is admin-controlled.
 */
export const assetService = {
  /** Creator lists a new asset. */
  create(creatorId: string, dto: CreateAssetDto): Promise<IAssetDocument> {
    assertPlatformForType(dto.assetType, dto.platform);
    return assetRepository.create({
      creatorId,
      assetType: dto.assetType,
      platform: dto.platform,
      category: ASSET_TYPE_CATEGORY[dto.assetType],
      title: dto.title,
      description: dto.description,
      estimatedReach: dto.estimatedReach,
      averageViews: dto.averageViews,
      audienceDemographics: dto.audienceDemographics,
      availability: dto.availability,
    });
  },

  /** Read one asset (public to any authenticated user). */
  async getById(id: string): Promise<IAssetDocument> {
    const asset = await assetRepository.findById(id);
    if (!asset) throw ApiError.notFound('Asset not found');
    return asset;
  },

  /** Public marketplace browse with search + filters. */
  browse(query: ListAssetsQuery): Promise<Paginated<IAssetDocument>> {
    return this.paginate(buildFilter(query), query);
  },

  /** The creator's own asset listings. */
  listMine(creatorId: string, query: ListAssetsQuery): Promise<Paginated<IAssetDocument>> {
    const filter: AssetFilter = { ...buildFilter(query), creatorId };
    return this.paginate(filter, query);
  },

  /** Aggregated analytics over the creator's assets. */
  analytics(creatorId: string): Promise<IAssetAnalytics> {
    return assetRepository.analyticsForCreator(creatorId);
  },

  /** Owner edits an asset; re-derives category and re-validates platform on change. */
  async update(id: string, creatorId: string, dto: UpdateAssetDto): Promise<IAssetDocument> {
    const asset = await this.loadOwned(id, creatorId);

    if (dto.assetType ?? dto.platform) {
      const nextType = dto.assetType ?? asset.assetType;
      const nextPlatform = dto.platform ?? asset.platform;
      assertPlatformForType(nextType, nextPlatform);
    }

    const patch: AssetPatch = {};
    if (dto.assetType) {
      patch.assetType = dto.assetType;
      patch.category = ASSET_TYPE_CATEGORY[dto.assetType];
    }
    if (dto.platform) patch.platform = dto.platform;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.estimatedReach !== undefined) patch.estimatedReach = dto.estimatedReach;
    if (dto.averageViews !== undefined) patch.averageViews = dto.averageViews;
    if (dto.audienceDemographics !== undefined) {
      patch.audienceDemographics = dto.audienceDemographics;
    }
    if (dto.availability !== undefined) {
      // Only status/leadTimeDays are editable here; blocks are managed via the
      // calendar endpoints, so preserve them.
      const next: IAvailability = {
        status: dto.availability.status ?? asset.availability.status,
        blocks: asset.availability.blocks,
      };
      const leadTime = dto.availability.leadTimeDays ?? asset.availability.leadTimeDays;
      if (leadTime !== undefined) next.leadTimeDays = leadTime;
      patch.availability = next;
    }

    const updated = await assetRepository.updateById(id, patch);
    return updated ?? asset;
  },

  /** Owner deletes an asset. */
  async remove(id: string, creatorId: string): Promise<void> {
    await this.loadOwned(id, creatorId);
    await assetRepository.deleteById(id);
  },

  // --- availability calendar ---------------------------------------------

  /** View an asset's availability + booked windows. */
  async getAvailability(id: string): Promise<IAvailability> {
    const asset = await assetRepository.findDocById(id);
    if (!asset) throw ApiError.notFound('Asset not found');
    return asset.availability;
  },

  /** Owner blocks out a window on the calendar (no overlaps allowed). */
  async addBlock(
    id: string,
    creatorId: string,
    dto: AvailabilityBlockDto
  ): Promise<IAssetDocument> {
    const asset = await this.loadOwned(id, creatorId);
    const overlaps = asset.availability.blocks.some(
      (b) =>
        dto.startDate.getTime() <= b.endDate.getTime() &&
        dto.endDate.getTime() >= b.startDate.getTime()
    );
    if (overlaps) {
      throw ApiError.conflict('This window overlaps an existing calendar block');
    }
    asset.availability.blocks.push({
      startDate: dto.startDate,
      endDate: dto.endDate,
      ...(dto.note !== undefined ? { note: dto.note } : {}),
    });
    await assetRepository.save(asset);
    return (await assetRepository.findById(id)) ?? asset;
  },

  /** Owner removes a calendar block by id. */
  async removeBlock(id: string, creatorId: string, blockId: string): Promise<IAssetDocument> {
    const asset = await this.loadOwned(id, creatorId);
    const index = asset.availability.blocks.findIndex((b) => b._id?.toString() === blockId);
    if (index === -1) {
      throw ApiError.notFound('Calendar block not found');
    }
    asset.availability.blocks.splice(index, 1);
    await assetRepository.save(asset);
    return (await assetRepository.findById(id)) ?? asset;
  },

  // --- internal ----------------------------------------------------------

  async paginate(filter: AssetFilter, query: ListAssetsQuery): Promise<Paginated<IAssetDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await assetRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  /** Load an asset and assert the caller owns it (else 404/403). */
  async loadOwned(id: string, creatorId: string): Promise<IAssetDocument> {
    const asset = await assetRepository.findDocById(id);
    if (!asset) {
      throw ApiError.notFound('Asset not found');
    }
    if (asset.creatorId.toString() !== creatorId) {
      throw ApiError.forbidden('You can only manage your own assets');
    }
    return asset;
  },
};

export type AssetService = typeof assetService;
