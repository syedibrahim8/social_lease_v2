import { Types } from 'mongoose';
import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { creatorRepository } from '@/modules/creators/creator.repository';
import { brandRepository } from '@/modules/brands/brand.repository';
import {
  verificationAuditRepository,
  verificationRepository,
  type VerificationFilter,
} from '@/modules/verifications/verification.repository';
import {
  VERIFICATION_TYPE_ROLE,
  type IVerificationAuditLogDocument,
  type IVerificationRequestDocument,
} from '@/modules/verifications/verification.types';
import type {
  ListMineQuery,
  ListVerificationsQuery,
  SubmitVerificationDto,
} from '@/modules/verifications/verification.validators';
import type { UserRole } from '@/types/roles';

type Requester = { id: string; role: UserRole };

/**
 * Verification use-cases.
 *
 * Users (creators/brands) submit typed verification requests with evidence; an
 * admin approves (syncing the profile's verification field → VERIFIED) or rejects
 * them. Every state change is written to an immutable audit log.
 */
export const verificationService = {
  /** A creator/brand submits a verification request for one facet. */
  async submit(
    requester: Requester,
    dto: SubmitVerificationDto
  ): Promise<IVerificationRequestDocument> {
    const requiredRole = VERIFICATION_TYPE_ROLE[dto.verificationType];
    if (requester.role !== requiredRole) {
      throw ApiError.badRequest(
        `${dto.verificationType} verification is only available to ${requiredRole} accounts`
      );
    }
    if (await verificationRepository.existsPending(requester.id, dto.verificationType)) {
      throw ApiError.conflict(
        `You already have a pending ${dto.verificationType} verification request`
      );
    }

    const created = await verificationRepository.create({
      userId: requester.id,
      role: requiredRole,
      verificationType: dto.verificationType,
      evidence: dto.evidence,
    });
    await verificationAuditRepository.create({
      requestId: created._id.toString(),
      actorId: requester.id,
      action: 'SUBMITTED',
      toStatus: 'PENDING',
    });
    return (await verificationRepository.findById(created._id.toString())) ?? created;
  },

  /** A user's own verification requests. */
  listMine(userId: string, query: ListMineQuery): Promise<Paginated<IVerificationRequestDocument>> {
    const filter: VerificationFilter = { userId };
    if (query.status) filter.status = query.status;
    if (query.verificationType) filter.verificationType = query.verificationType;
    return this.paginate(filter, query);
  },

  /** Fetch one request — owner or admin only (404 to everyone else). */
  async getById(id: string, requester: Requester): Promise<IVerificationRequestDocument> {
    const request = await verificationRepository.findDocById(id);
    const allowed =
      request && (request.userId.toString() === requester.id || requester.role === 'ADMIN');
    if (!allowed) {
      throw ApiError.notFound('Verification request not found');
    }
    return (await verificationRepository.findById(id)) ?? request;
  },

  // --- admin -------------------------------------------------------------

  /** Admin: list all requests with filters. */
  adminList(query: ListVerificationsQuery): Promise<Paginated<IVerificationRequestDocument>> {
    const filter: VerificationFilter = {};
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
    if (query.verificationType) filter.verificationType = query.verificationType;
    if (query.userId) filter.userId = query.userId;
    return this.paginate(filter, query);
  },

  /** Admin: approve a pending request → sync the profile's verification field. */
  async approve(id: string, adminId: string, note?: string): Promise<IVerificationRequestDocument> {
    const request = await this.loadPending(id);

    request.status = 'APPROVED';
    request.reviewedBy = new Types.ObjectId(adminId);
    request.reviewedAt = new Date();
    if (note !== undefined) request.reviewNote = note;
    await verificationRepository.save(request);

    await this.applyApproval(request);
    await verificationAuditRepository.create({
      requestId: id,
      actorId: adminId,
      action: 'APPROVED',
      fromStatus: 'PENDING',
      toStatus: 'APPROVED',
      note,
    });
    return (await verificationRepository.findById(id)) ?? request;
  },

  /** Admin: reject a pending request (profile is left unchanged). */
  async reject(id: string, adminId: string, note: string): Promise<IVerificationRequestDocument> {
    const request = await this.loadPending(id);

    request.status = 'REJECTED';
    request.reviewedBy = new Types.ObjectId(adminId);
    request.reviewedAt = new Date();
    request.reviewNote = note;
    await verificationRepository.save(request);

    await verificationAuditRepository.create({
      requestId: id,
      actorId: adminId,
      action: 'REJECTED',
      fromStatus: 'PENDING',
      toStatus: 'REJECTED',
      note,
    });
    return (await verificationRepository.findById(id)) ?? request;
  },

  /** Admin: the audit trail for a request. */
  async listAudit(id: string): Promise<IVerificationAuditLogDocument[]> {
    const request = await verificationRepository.findDocById(id);
    if (!request) {
      throw ApiError.notFound('Verification request not found');
    }
    return verificationAuditRepository.listByRequest(id);
  },

  // --- internal ----------------------------------------------------------

  /** Sync the approved facet onto the user's profile (best-effort if no profile). */
  async applyApproval(request: IVerificationRequestDocument): Promise<void> {
    const userId = request.userId.toString();
    if (request.role === 'CREATOR') {
      if (request.verificationType === 'PROFILE_OWNERSHIP') {
        await creatorRepository.setVerification(userId, { profileOwnershipStatus: 'VERIFIED' });
      } else {
        await creatorRepository.setVerification(userId, { verificationStatus: 'VERIFIED' });
      }
    } else {
      await brandRepository.setVerification(userId, 'VERIFIED');
    }
  },

  async loadPending(id: string): Promise<IVerificationRequestDocument> {
    const request = await verificationRepository.findDocById(id);
    if (!request) {
      throw ApiError.notFound('Verification request not found');
    }
    if (request.status !== 'PENDING') {
      throw ApiError.conflict(`This request has already been ${request.status.toLowerCase()}`);
    }
    return request;
  },

  async paginate(
    filter: VerificationFilter,
    query: { page?: number | undefined; limit?: number | undefined }
  ): Promise<Paginated<IVerificationRequestDocument>> {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await verificationRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};

export type VerificationService = typeof verificationService;
