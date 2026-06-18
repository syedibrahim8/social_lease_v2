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
import {
  EDITABLE_SUBMISSION_STATUSES,
  type ISubmissionDocument,
} from '@/modules/submissions/submission.types';
import type {
  CreateSubmissionDto,
  ListSubmissionsQuery,
  UpdateSubmissionDto,
} from '@/modules/submissions/submission.validators';

/** Contract states from which a creator may (re)submit proof of work. */
const SUBMITTABLE_CONTRACT_STATUSES = ['FUNDED', 'IN_PROGRESS'] as const;

function isSubmittable(status: string): boolean {
  return (SUBMITTABLE_CONTRACT_STATUSES as readonly string[]).includes(status);
}

/**
 * Campaign delivery (proof of work) use-cases — the step between funding and
 * payout.
 *
 * Creators upload proof against a FUNDED contract (DRAFT), edit it, then submit
 * it for review. The brand approves (→ APPROVED, auto-releasing the escrowed
 * payout), rejects, or requests a revision. The payout only moves once a
 * delivery is APPROVED — see `paymentService.releasePayment`.
 */
export const submissionService = {
  /** Upload proof — create a DRAFT delivery for a funded contract. */
  async create(creatorId: string, dto: CreateSubmissionDto): Promise<ISubmissionDocument> {
    const contract = await contractRepository.findDocById(dto.contractId);
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    if (contract.creatorId.toString() !== creatorId) {
      throw ApiError.forbidden('Only the assigned creator can deliver work for this contract');
    }
    if (contract.status === 'PENDING_FUNDING') {
      throw ApiError.conflict('This contract has not been funded yet');
    }
    if (!isSubmittable(contract.status)) {
      throw ApiError.conflict(`Work cannot be delivered while the contract is ${contract.status}`);
    }
    if (await submissionRepository.findActiveByContract(dto.contractId)) {
      throw ApiError.conflict(
        'You already have an active delivery for this contract — update it instead'
      );
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
      files: dto.files ?? [],
      links: dto.links ?? [],
      note: dto.note,
      analytics: dto.analytics,
    });

    return (await submissionRepository.findById(submission._id.toString())) ?? submission;
  },

  /** Update proof — edit a DRAFT / REVISION_REQUESTED delivery. */
  async update(
    id: string,
    creatorId: string,
    dto: UpdateSubmissionDto
  ): Promise<ISubmissionDocument> {
    const submission = await this.loadOwned(id, creatorId);
    if (!EDITABLE_SUBMISSION_STATUSES.includes(submission.status)) {
      throw ApiError.conflict(`A ${submission.status} delivery can no longer be edited`);
    }
    if (dto.files !== undefined) submission.files = dto.files;
    if (dto.links !== undefined) submission.links = dto.links;
    if (dto.note !== undefined) submission.note = dto.note;
    if (dto.analytics !== undefined) submission.analytics = dto.analytics;
    await submissionRepository.save(submission);
    return (await submissionRepository.findById(id)) ?? submission;
  },

  /** Submit a delivery for the brand's review (DRAFT/REVISION_REQUESTED → SUBMITTED). */
  async submit(id: string, creatorId: string): Promise<ISubmissionDocument> {
    const submission = await this.loadOwned(id, creatorId);
    if (!EDITABLE_SUBMISSION_STATUSES.includes(submission.status)) {
      throw ApiError.conflict(`A ${submission.status} delivery cannot be submitted`);
    }
    if (submission.files.length === 0 && submission.links.length === 0) {
      throw ApiError.badRequest('Attach at least one file or link as proof before submitting');
    }
    const contract = await contractRepository.findDocById(submission.contractId.toString());
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }
    if (!isSubmittable(contract.status)) {
      throw ApiError.conflict(`This contract is ${contract.status} and cannot receive a delivery`);
    }

    if (submission.status === 'REVISION_REQUESTED') submission.revision += 1;
    submission.status = 'SUBMITTED';
    submission.submittedAt = new Date();
    await submissionRepository.save(submission);

    contract.status = 'SUBMITTED';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'SUBMITTED' });

    return (await submissionRepository.findById(id)) ?? submission;
  },

  /**
   * Brand approves the proof → contract APPROVED, then auto-release the escrowed
   * payout if the creator is payout-ready (else the contract stays APPROVED and
   * the brand completes the payout once the creator finishes onboarding).
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
      logger.info('Delivery approved; payout deferred until the creator completes onboarding', {
        submissionId: id,
        contractId: contract._id.toString(),
      });
    }

    const fresh = (await submissionRepository.findById(id)) ?? submission;
    return { submission: fresh, released };
  },

  /** Brand requests changes → REVISION_REQUESTED, contract back to IN_PROGRESS. */
  async requestRevision(
    id: string,
    brandUserId: string,
    reviewNote: string
  ): Promise<ISubmissionDocument> {
    return this.returnForRework(id, brandUserId, 'REVISION_REQUESTED', reviewNote);
  },

  /** Brand rejects the proof → REJECTED, contract back to IN_PROGRESS. */
  async reject(id: string, brandUserId: string, reviewNote: string): Promise<ISubmissionDocument> {
    return this.returnForRework(id, brandUserId, 'REJECTED', reviewNote);
  },

  // --- reads -------------------------------------------------------------

  /** Fetch one delivery — parties only; the brand can't see a creator's DRAFT. */
  async getById(id: string, userId: string): Promise<ISubmissionDocument> {
    const submission = await this.loadParty(id, userId);
    if (submission.status === 'DRAFT' && submission.creatorId.toString() !== userId) {
      throw ApiError.notFound('Submission not found');
    }
    return (await submissionRepository.findById(id)) ?? submission;
  },

  /** The creator's own deliveries. */
  listMine(
    creatorId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const filter: SubmissionFilter = { creatorId };
    if (query.status) filter.status = query.status;
    if (query.contractId) filter.contractId = query.contractId;
    return this.paginate(filter, query);
  },

  /** Deliveries a brand has received (DRAFTs are hidden). */
  listReceived(
    brandUserId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const filter: SubmissionFilter = { brandId: brandUserId };
    filter.status = query.status && query.status !== 'DRAFT' ? query.status : { $ne: 'DRAFT' };
    if (query.contractId) filter.contractId = query.contractId;
    return this.paginate(filter, query);
  },

  /** Full delivery history for one contract — parties only (DRAFTs hidden from brand). */
  async listForContract(
    contractId: string,
    userId: string,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const contract = await contractRepository.findDocById(contractId);
    const isCreator = contract?.creatorId.toString() === userId;
    const isBrand = contract?.brandId.toString() === userId;
    if (!isCreator && !isBrand) {
      throw ApiError.notFound('Contract not found');
    }
    const filter: SubmissionFilter = { contractId };
    if (isBrand && !isCreator) {
      filter.status = query.status && query.status !== 'DRAFT' ? query.status : { $ne: 'DRAFT' };
    } else if (query.status) {
      filter.status = query.status;
    }
    return this.paginate(filter, query);
  },

  // --- internal ----------------------------------------------------------

  /** Shared reject / request-revision transition (→ contract IN_PROGRESS). */
  async returnForRework(
    id: string,
    brandUserId: string,
    status: 'REJECTED' | 'REVISION_REQUESTED',
    reviewNote: string
  ): Promise<ISubmissionDocument> {
    const submission = await this.loadForReview(id, brandUserId);
    const contract = await contractRepository.findDocById(submission.contractId.toString());
    if (!contract) {
      throw ApiError.notFound('Contract not found');
    }

    submission.status = status;
    submission.reviewNote = reviewNote;
    submission.reviewedAt = new Date();
    await submissionRepository.save(submission);

    contract.status = 'IN_PROGRESS';
    await contractRepository.save(contract);
    await campaignRepository.updateById(contract.campaignId.toString(), { status: 'IN_PROGRESS' });

    return (await submissionRepository.findById(id)) ?? submission;
  },

  async paginate(
    filter: SubmissionFilter,
    query: ListSubmissionsQuery
  ): Promise<Paginated<ISubmissionDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await submissionRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  /** Load a delivery and assert the caller is the owning creator (else 404/403). */
  async loadOwned(id: string, creatorId: string): Promise<ISubmissionDocument> {
    const submission = await submissionRepository.findDocById(id);
    if (!submission) {
      throw ApiError.notFound('Submission not found');
    }
    if (submission.creatorId.toString() !== creatorId) {
      throw ApiError.forbidden('You can only manage your own deliveries');
    }
    return submission;
  },

  /** Load a SUBMITTED delivery and assert the caller is its brand (else 404/409). */
  async loadForReview(id: string, brandUserId: string): Promise<ISubmissionDocument> {
    const submission = await submissionRepository.findDocById(id);
    if (!submission || submission.brandId.toString() !== brandUserId) {
      throw ApiError.notFound('Submission not found');
    }
    if (submission.status !== 'SUBMITTED') {
      throw ApiError.conflict(`This delivery is ${submission.status} and is not awaiting review`);
    }
    return submission;
  },

  /** Load a delivery and assert the caller is a party (else 404). */
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
