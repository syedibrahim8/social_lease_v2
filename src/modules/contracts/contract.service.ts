import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import type { ICampaignDocument } from '@/modules/campaigns/campaign.types';
import type { IApplicationDocument } from '@/modules/applications/application.types';
import { contractRepository, type ContractFilter } from '@/modules/contracts/contract.repository';
import {
  CANCELLABLE_CONTRACT_STATUSES,
  type IContractDocument,
  type IDeliverable,
} from '@/modules/contracts/contract.types';
import type { ListContractsQuery } from '@/modules/contracts/contract.validators';

/**
 * Contract use-cases.
 *
 * Contracts are auto-generated from an accepted application (`createFromApplication`,
 * called by the applications service) — there is no public create endpoint. Reads
 * are restricted to the two parties; cancellation is allowed only before funding.
 */
export const contractService = {
  /**
   * Generate a contract from an accepted application + its campaign. Idempotency
   * is guaranteed by the unique `applicationId` index.
   */
  async createFromApplication(
    application: IApplicationDocument,
    campaign: ICampaignDocument
  ): Promise<IContractDocument> {
    const deliverables: IDeliverable[] = [
      {
        description: `Deliver 1 ${application.assetType} on ${campaign.platform}, live for ${campaign.duration} day(s)`,
        completed: false,
      },
      ...campaign.requirements.map((req) => ({ description: req, completed: false })),
    ];

    return contractRepository.create({
      applicationId: application._id.toString(),
      campaignId: application.campaignId.toString(),
      brandId: application.brandId.toString(),
      creatorId: application.creatorId.toString(),
      assetType: application.assetType,
      platform: campaign.platform,
      agreedPrice: application.agreedPrice ?? application.proposedPrice,
      currency: application.currency,
      deliverables,
      timeline: { durationDays: campaign.duration },
    });
  },

  /** Fetch one contract — parties only (404 to everyone else). */
  async getById(id: string, userId: string): Promise<IContractDocument> {
    const contract = await this.loadParty(id, userId);
    return (await contractRepository.findById(id)) ?? contract;
  },

  /** All contracts the user is a party to (as brand or creator). */
  list(userId: string, query: ListContractsQuery): Promise<Paginated<IContractDocument>> {
    const filter: ContractFilter = { $or: [{ brandId: userId }, { creatorId: userId }] };
    if (query.status) filter.status = query.status;
    if (query.campaignId) filter.campaignId = query.campaignId;
    return this.paginate(filter, query);
  },

  /** Cancel a contract before any funds are committed; cancels the campaign too. */
  async cancel(id: string, userId: string): Promise<IContractDocument> {
    const contract = await this.loadParty(id, userId);
    if (!CANCELLABLE_CONTRACT_STATUSES.includes(contract.status)) {
      throw ApiError.conflict(`A contract in status ${contract.status} can no longer be cancelled`);
    }
    contract.status = 'CANCELLED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'CANCELLED' });
    return (await contractRepository.findById(id)) ?? contract;
  },

  // --- internal ----------------------------------------------------------

  async paginate(
    filter: ContractFilter,
    query: ListContractsQuery
  ): Promise<Paginated<IContractDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await contractRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  /** Load a contract and assert the caller is a party (else 404). */
  async loadParty(id: string, userId: string): Promise<IContractDocument> {
    const contract = await contractRepository.findDocById(id);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    const isParty =
      contract.brandId.toString() === userId || contract.creatorId.toString() === userId;
    if (!isParty) {
      throw ApiError.notFound('Contract not found');
    }
    return contract;
  },
};

export type ContractService = typeof contractService;
