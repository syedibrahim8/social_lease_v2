import type { FilterQuery } from 'mongoose';
import {
  VerificationAuditLogModel,
  VerificationRequestModel,
} from '@/modules/verifications/verification.model';
import type {
  IVerificationAuditLogDocument,
  IVerificationEvidence,
  IVerificationRequestDocument,
  VerifiableRole,
  VerificationAction,
  VerificationRequestStatus,
  VerificationType,
} from '@/modules/verifications/verification.types';
import type { PageParams } from '@/utils/pagination';

const REQUEST_POPULATE = [
  { path: 'userId', select: 'name email avatar role' },
  { path: 'reviewedBy', select: 'name email role' },
];

type VerificationFilter = FilterQuery<IVerificationRequestDocument>;

interface NewVerificationRequest {
  userId: string;
  role: VerifiableRole;
  verificationType: VerificationType;
  evidence: IVerificationEvidence;
}

interface NewAuditLog {
  requestId: string;
  actorId: string;
  action: VerificationAction;
  toStatus: VerificationRequestStatus;
  fromStatus?: VerificationRequestStatus | undefined;
  note?: string | undefined;
}

/** VerificationRepository — the only seam over the VerificationRequest model. */
export const verificationRepository = {
  create(data: NewVerificationRequest): Promise<IVerificationRequestDocument> {
    return new VerificationRequestModel(data).save();
  },

  findById(id: string): Promise<IVerificationRequestDocument | null> {
    return VerificationRequestModel.findById(id).populate(REQUEST_POPULATE).exec();
  },

  /** Un-populated — for ownership/status mutations. */
  findDocById(id: string): Promise<IVerificationRequestDocument | null> {
    return VerificationRequestModel.findById(id).exec();
  },

  /** Friendly pre-check for the one-pending-per-type rule (DB index is the backstop). */
  existsPending(userId: string, verificationType: VerificationType): Promise<boolean> {
    return VerificationRequestModel.exists({ userId, verificationType, status: 'PENDING' })
      .exec()
      .then((doc) => doc !== null);
  },

  save(doc: IVerificationRequestDocument): Promise<IVerificationRequestDocument> {
    return doc.save();
  },

  async list(
    filter: VerificationFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: IVerificationRequestDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      VerificationRequestModel.find(filter)
        .populate(REQUEST_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      VerificationRequestModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },
};

/** VerificationAuditRepository — append-only ledger of review actions. */
export const verificationAuditRepository = {
  create(data: NewAuditLog): Promise<IVerificationAuditLogDocument> {
    return new VerificationAuditLogModel(data).save();
  },

  listByRequest(requestId: string): Promise<IVerificationAuditLogDocument[]> {
    return VerificationAuditLogModel.find({ requestId })
      .populate({ path: 'actorId', select: 'name email role' })
      .sort({ createdAt: -1 })
      .exec();
  },
};

export type VerificationRepository = typeof verificationRepository;
export type { VerificationFilter };
