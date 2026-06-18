import { Schema, model } from 'mongoose';
import {
  VERIFICATION_ACTIONS,
  VERIFICATION_REQUEST_STATUSES,
  VERIFICATION_TYPES,
  type IVerificationAuditLogDocument,
  type IVerificationAuditLogModel,
  type IVerificationRequestDocument,
  type IVerificationRequestModel,
} from '@/modules/verifications/verification.types';

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
};

const evidenceSchema = new Schema(
  {
    profileUrl: { type: String, trim: true, maxlength: 2048 },
    handle: { type: String, trim: true, maxlength: 120 },
    businessEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    documents: { type: [String], default: undefined },
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const verificationRequestSchema = new Schema<
  IVerificationRequestDocument,
  IVerificationRequestModel
>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['CREATOR', 'BRAND'], required: true, index: true },
    verificationType: { type: String, enum: VERIFICATION_TYPES, required: true, index: true },
    status: {
      type: String,
      enum: VERIFICATION_REQUEST_STATUSES,
      default: 'PENDING',
      required: true,
      index: true,
    },
    evidence: { type: evidenceSchema, default: () => ({}) },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
  },
  { timestamps: true, toJSON }
);

// At most one PENDING request per (user, type) — race-safe, DB-enforced. Once a
// request is reviewed the slot frees up for a re-submission of that type.
verificationRequestSchema.index(
  { userId: 1, verificationType: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

const verificationAuditLogSchema = new Schema<
  IVerificationAuditLogDocument,
  IVerificationAuditLogModel
>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'VerificationRequest',
      required: true,
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: VERIFICATION_ACTIONS, required: true },
    fromStatus: { type: String, enum: VERIFICATION_REQUEST_STATUSES },
    toStatus: { type: String, enum: VERIFICATION_REQUEST_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, toJSON }
);

verificationAuditLogSchema.index({ requestId: 1, createdAt: -1 });

export const VerificationRequestModel = model<
  IVerificationRequestDocument,
  IVerificationRequestModel
>('VerificationRequest', verificationRequestSchema);

export const VerificationAuditLogModel = model<
  IVerificationAuditLogDocument,
  IVerificationAuditLogModel
>('VerificationAuditLog', verificationAuditLogSchema);
