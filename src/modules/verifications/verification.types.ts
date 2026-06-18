import type { Document, Model, Types } from 'mongoose';

/**
 * Verification request lifecycle (admin-reviewed):
 *   PENDING  — submitted, awaiting an admin
 *   APPROVED — admin accepted (syncs the profile's verification field → VERIFIED)
 *   REJECTED — admin declined (profile is left unchanged)
 */
export const VERIFICATION_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type VerificationRequestStatus = (typeof VERIFICATION_REQUEST_STATUSES)[number];

/** Verification facets a creator can request. */
export const CREATOR_VERIFICATION_TYPES = [
  'SOCIAL_PROFILE',
  'PROFILE_OWNERSHIP',
  'IDENTITY',
] as const;
/** Verification facets a brand can request. */
export const BRAND_VERIFICATION_TYPES = ['WEBSITE', 'BUSINESS_EMAIL', 'COMPANY'] as const;

export const VERIFICATION_TYPES = [
  ...CREATOR_VERIFICATION_TYPES,
  ...BRAND_VERIFICATION_TYPES,
] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export type VerifiableRole = 'CREATOR' | 'BRAND';

/** Each verification type belongs to exactly one role (enforced on submit). */
export const VERIFICATION_TYPE_ROLE: Record<VerificationType, VerifiableRole> = {
  SOCIAL_PROFILE: 'CREATOR',
  PROFILE_OWNERSHIP: 'CREATOR',
  IDENTITY: 'CREATOR',
  WEBSITE: 'BRAND',
  BUSINESS_EMAIL: 'BRAND',
  COMPANY: 'BRAND',
};

export const VERIFICATION_ACTIONS = ['SUBMITTED', 'APPROVED', 'REJECTED'] as const;
export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number];

/** Supporting material a user attaches to a request (fields vary by type). */
export interface IVerificationEvidence {
  profileUrl?: string | undefined;
  handle?: string | undefined;
  businessEmail?: string | undefined;
  documents?: string[] | undefined;
  note?: string | undefined;
}

export interface IVerificationRequest {
  userId: Types.ObjectId;
  role: VerifiableRole;
  verificationType: VerificationType;
  status: VerificationRequestStatus;
  evidence: IVerificationEvidence;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
  reviewedAt?: Date;
}

export interface IVerificationRequestDocument
  extends IVerificationRequest, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type IVerificationRequestModel = Model<IVerificationRequestDocument>;

/** Immutable audit entry recording every state change on a request. */
export interface IVerificationAuditLog {
  requestId: Types.ObjectId;
  actorId: Types.ObjectId;
  action: VerificationAction;
  fromStatus?: VerificationRequestStatus;
  toStatus: VerificationRequestStatus;
  note?: string;
}

export interface IVerificationAuditLogDocument
  extends IVerificationAuditLog, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type IVerificationAuditLogModel = Model<IVerificationAuditLogDocument>;
