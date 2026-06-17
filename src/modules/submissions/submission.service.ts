import { logger } from '@/config/logger';
import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { contractRepository } from '@/modules/contracts/contract.repository';
import { campaignRepository } from '@/modules/campaigns/campaign.repository';
import { paymentService } from '@/modules/payments/payment.service';
import {
  submissionRepository,
  type SubmissionFilter,
} from '@/modules/submissions/submission.repository';
import type { ISubmissionDocument } from '@/modules/submissions/submission.types';
import type {
  CreateSubmissionDto,
  ListSubmissionsQuery,
} from '@/modules/submissions/submission.validators';

/** Contract states from which a creator may (re)submit proof of work. */
const SUBMITTABLE_CONTRACT_STATUSES = ['FUNDED', 'IN_PROGRESS'] as const;

/**
 * Submission use-cases — the proof-of-work step between funding and payout.
 *
 * Flow: creator submits against a FUNDED contract (→ SUBMITTED); the brand
 * either approves (→ APPROVED, then auto-release of the escrowed payout) or
 * requests a revision (→ IN_PROGRESS, creator resubmits). The payout can only
 * move once a submission is APPROVED — see `paymentService.releasePayment`.
 */
export const submissionService = {
  /** Creator submits proof of work for a funded contract. */
  async create(creatorId: string, dto: CreateSubmissionDto): Promise<ISubmissionDocument> {
    const contract = await contractRepository.findDocById(dto.contractId);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    if (contract.creatorId.toString() !== creatorId) {
      throw ApiError.forbidden('Only the assigned creator can submit work for this contract');
    }
    if (contract.status === 'PENDING_FUNDING') {
      throw ApiError.conflict('This contract has not been funded yet');
    }
    if (contract.status === 'SUBMITTED') {
      throw ApiError.conflict('A submission is already awaiting the brand’s review');
    }
    if (!SUBMITTABLE_CONTRACT_STATUSES.includes(contract.status as never)) {
      throw ApiError.conflict(`Work cannot be submitted while the contract is ${contract.status}`);
    }

    const revision = (await submissionRepository.countByContract(dto.contractId)) + 1;
    const submission = await submissionRepository.create({
      contractId: dto.contractId,
      campaignId: contract.campaignId.toString(),
      brandId: contract.brandId.toString(),
      creatorId: contract.creatorId.toString(),
      assetType: contract.assetType,
      platform: contract.platform,
      revision,
      mediaUrls: dto.mediaUrls ?? [],
      note: dto.note,
      liveUrl: dto.liveUrl,
      analytics: dto.analytics,
    });

    contract.status = 'SUBMITTED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'SUBMITTED' });

    return (await submissionRepository.findById(submission._id.toString())) ?? submission;
  },

  /**
   * Brand approves the proof → contract APPROVED, then auto-release the escrowed
   * payout if the creator is payout-ready. If the creator hasn't finished Connect
   * onboarding, the contract stays APPROVED and the brand can complete the payout
   * later via the payments release endpoint.
   */
  async approve(
    id: string,
    brandUserId: string
  ): Promise<{ submission: ISubmissionDocument; released: boolean }> {
    const submission = await this.loadForReview(id, brandUserId);
    const contract = await contractRepository.findDocById(submission.contractId.toString());
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }

    submission.status = 'APPROVED';
    submission.reviewedAt = new Date();
    await submissionRepository.save(submission);

    contract.status = 'APPROVED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'APPROVED' });

    const { released } = await paymentService.releaseForApprovedContract(contract._id.toString());
    if (!released) {
      logger.info('Submission approved; payout deferred until the creator completes onboarding', {
        submissionId: id,
        contractId: contract._id.toString(),
      });
    }

    const fresh = (await submissionRepository.findById(id)) ?? submission;
    return { submission: fresh, released };
  },

  /** Brand requests changes → submission REVISION_REQUESTED, contract back to IN_PROGRESS. */
  async requestRevision(
    id: string,
    brandUserId: string,
    reviewNote: string
  ): Promise<ISubmissionDocument> {
    const submission = await this.loadForReview(id, brandUserId);
    const contract = await contractRepository.findDocById(submission.contractId.toString());
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }

    submission.status = 'REVISION_REQUESTED';
    submission.reviewNote = reviewNote;
    submission.reviewedAt = new Date();
    await submissionRepository.save(submission);

    contract.status = 'IN_PROGRESS';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'IN_PROGRESS' });

    return (await submissionRepository.findById(id)) ?? submission;
  },

  // --- reads -------------------------------------------------------------

  /** Fetch one submission — parties only (404 to everyone else). */
  async getById(id: string, userId: string): Promise<ISubmissionDocument> {
    const submission = await this.loadParty(id, userId);
    return (await submissionRepository.findById(id)) ?? submission;
  },

  /** The creator's own submissions. */
  listMine(
    creatorId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const filter: SubmissionFilter = { creatorId };
    if (query.status) filter.status = query.status;
    if (query.contractId) filter.contractId = query.contractId;
    return this.paginate(filter, query);
  },

  /** Submissions a brand has received across their contracts. */
  listReceived(
    brandUserId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const filter: SubmissionFilter = { brandId: brandUserId };
    if (query.status) filter.status = query.status;
    if (query.contractId) filter.contractId = query.contractId;
    return this.paginate(filter, query);
  },

  /** Full submission history for one contract — parties only. */
  async listForContract(
    contractId: string,
    userId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const contract = await contractRepository.findDocById(contractId);
    const isParty =
      contract &&
      (contract.brandId.toString() === userId || contract.creatorId.toString() === userId);
    if (!isParty) {
      throw ApiError.notFound('Contract not found');
    }
    const filter: SubmissionFilter = { contractId };
    if (query.status) filter.status = query.status;
    return this.paginate(filter, query);
  },

  // --- internal ----------------------------------------------------------

  async paginate(
    filter: SubmissionFilter,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await submissionRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  /** Load a pending submission and assert the caller is its brand (else 404/409). */
  async loadForReview(id: string, brandUserId: string): Promise<ISubmissionDocument> {
    const submission = await submissionRepository.findDocById(id);
    if (!submission || submission.brandId.toString() !== brandUserId) {
      throw ApiError.notFound('Submission not found');
    }
    if (submission.status !== 'PENDING') {
      throw ApiError.conflict(`This submission has already been reviewed (${submission.status})`);
    }
    return submission;
  },

  /** Load a submission and assert the caller is a party (else 404). */
  async loadParty(id: string, userId: string): Promise<ISubmissionDocument> {
    const submission = await submissionRepository.findDocById(id);
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }
    const isParty =
      submission.brandId.toString() === userId || submission.creatorId.toString() === userId;
    if (!isParty) {
      throw ApiError.notFound('Submission not found');
    }
    return submission;
  },
};

export type SubmissionService = typeof submissionService;
