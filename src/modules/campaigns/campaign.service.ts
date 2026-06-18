import { ApiError } from '@/utils/ApiError';
import { eventBus } from '@/events/event-bus';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { campaignRepository, type CampaignFilter } from '@/modules/campaigns/campaign.repository';
import {
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
  type ICampaignDocument,
} from '@/modules/campaigns/campaign.types';
import type {
  CreateCampaignDto,
  ListCampaignsQuery,
  UpdateCampaignDto,
} from '@/modules/campaigns/campaign.validators';

/**
 * Campaign use-cases.
 *
 * Ownership: a brand owns many campaigns, so mutations are by id with an
 * explicit owner check (`brandId === userId`). The early lifecycle transition
 * (DRAFT → PUBLISHED) lives here; later states are advanced by other modules.
 */
export const campaignService = {
  /** Create a draft campaign owned by the calling brand. */
  async createCampaign(brandUserId: string, dto: CreateCampaignDto): Promise<ICampaignDocument> {
    const campaign = await campaignRepository.create({ brandId: brandUserId, ...dto });
    eventBus.emit('campaign.created', {
      campaignId: campaign._id.toString(),
      brandId: brandUserId,
      title: campaign.title,
    });
    return campaign;
  },

  /**
   * Fetch one campaign. Drafts are private: only the owner may see a DRAFT;
   * to everyone else it appears not to exist.
   */
  async getCampaign(id: string, requesterId?: string): Promise<ICampaignDocument> {
    const raw = await campaignRepository.findRawById(id);
    if (!raw) {
      throw ApiError.notFound('Campaign not found');
    }
    if (raw.status === 'DRAFT' && raw.brandId.toString() !== requesterId) {
      throw ApiError.notFound('Campaign not found');
    }
    // Re-fetch populated for the response.
    return (await campaignRepository.findById(id)) ?? raw;
  },

  /** Public marketplace browse — only PUBLISHED campaigns. */
  listPublished(query: ListCampaignsQuery): Promise<Paginated<ICampaignDocument>> {
    const filter: CampaignFilter = { status: 'PUBLISHED' };
    applyCommonFilters(filter, query);
    return paginate(filter, query);
  },

  /** A brand's own campaigns — all statuses, optionally filtered by status. */
  listMine(brandUserId: string, query: ListCampaignsQuery): Promise<Paginated<ICampaignDocument>> {
    const filter: CampaignFilter = { brandId: brandUserId };
    if (query.status) filter.status = query.status;
    applyCommonFilters(filter, query);
    return paginate(filter, query);
  },

  /** Update own campaign — allowed only while editable (DRAFT/PUBLISHED). */
  async updateCampaign(
    id: string,
    brandUserId: string,
    dto: UpdateCampaignDto
  ): Promise<ICampaignDocument> {
    const campaign = await this.loadOwned(id, brandUserId);
    if (!EDITABLE_STATUSES.includes(campaign.status)) {
      throw ApiError.conflict(`A campaign in status ${campaign.status} can no longer be edited`);
    }

    // Cross-field budget check against the post-update values.
    const nextMin = dto.budgetMin ?? campaign.budgetMin;
    const nextMax = dto.budgetMax ?? campaign.budgetMax;
    if (nextMax < nextMin) {
      throw ApiError.badRequest('budgetMax must be greater than or equal to budgetMin');
    }

    const updated = await campaignRepository.updateById(id, dto);
    return updated ?? campaign;
  },

  /** Delete own campaign — blocked once money/work is committed. */
  async deleteCampaign(id: string, brandUserId: string): Promise<void> {
    const campaign = await this.loadOwned(id, brandUserId);
    if (!DELETABLE_STATUSES.includes(campaign.status)) {
      throw ApiError.conflict(`A campaign in status ${campaign.status} cannot be deleted`);
    }
    await campaignRepository.deleteById(id);
  },

  /** Publish own campaign — DRAFT → PUBLISHED. */
  async publishCampaign(id: string, brandUserId: string): Promise<ICampaignDocument> {
    const campaign = await this.loadOwned(id, brandUserId);
    if (campaign.status !== 'DRAFT') {
      throw ApiError.conflict(
        `Only a DRAFT campaign can be published (current: ${campaign.status})`
      );
    }
    const updated = await campaignRepository.updateById(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });
    return updated ?? campaign;
  },

  /** Load a campaign and assert the caller owns it (else 404/403). */
  async loadOwned(id: string, brandUserId: string): Promise<ICampaignDocument> {
    const campaign = await campaignRepository.findRawById(id);
    if (!campaign) {
      throw ApiError.notFound('Campaign not found');
    }
    if (campaign.brandId.toString() !== brandUserId) {
      throw ApiError.forbidden('You can only manage your own campaigns');
    }
    return campaign;
  },
};

function applyCommonFilters(filter: CampaignFilter, query: ListCampaignsQuery): void {
  if (query.assetType) filter.assetType = query.assetType;
  if (query.platform) filter.platform = query.platform;
  // Budget overlap: a campaign matches if its range intersects [minBudget, maxBudget].
  if (query.minBudget !== undefined) filter.budgetMax = { $gte: query.minBudget };
  if (query.maxBudget !== undefined) filter.budgetMin = { $lte: query.maxBudget };
  if (query.search) filter.$text = { $search: query.search };
}

async function paginate(
  filter: CampaignFilter,
  query: ListCampaignsQuery
): Promise<Paginated<ICampaignDocument>> {
  const { page, limit, skip } = resolvePagination(query.page, query.limit);
  const { items, total } = await campaignRepository.list(filter, { page, limit, skip });
  return { items, meta: buildPaginationMeta(page, limit, total) };
}

export type CampaignService = typeof campaignService;
