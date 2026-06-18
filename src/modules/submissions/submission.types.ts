import type { Document, Model, Types } from 'mongoose';
import type { AssetType, Platform } from '@/modules/campaigns/campaign.types';

/**
 * Campaign delivery (proof of work) lifecycle:
 *   DRAFT              — creator is preparing the proof (editable, not yet sent)
 *   SUBMITTED          — sent to the brand; awaiting review
 *   APPROVED           — brand accepted (gates + triggers the escrow payout)
 *   REJECTED           — brand declined this proof (contract returns to IN_PROGRESS)
 *   REVISION_REQUESTED — brand wants changes; the creator edits + resubmits this doc
 *
 * At most ONE active (non-terminal) delivery exists per contract at a time, and
 * the SUBMITTED state is DB-locked (partial-unique) so only one proof is ever
 * under review — keeping the approve→payout path single and race-safe.
 */
export const SUBMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'REVISION_REQUESTED',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/** Non-terminal states — only one such delivery may exist per contract. */
export const ACTIVE_SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_REQUESTED',
];
/** States in which the creator may still edit / (re)submit the delivery. */
export const EDITABLE_SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
  'DRAFT',
  'REVISION_REQUESTED',
];

/** Uploaded proof-file kinds. Plain URL proof (live post, etc.) lives in `links`. */
export const DELIVERY_FILE_TYPES = ['SCREENSHOT', 'ANALYTICS_SCREENSHOT', 'DOCUMENT'] as const;
export type DeliveryFileType = (typeof DELIVERY_FILE_TYPES)[number];

/** A file attached as proof (URL; Cloudinary uploads slot in later). */
export interface IDeliveryFile {
  type: DeliveryFileType;
  url: string;
  caption?: string | undefined;
}

/** A URL link submitted as proof (e.g. the live post). */
export interface IDeliveryLink {
  url: string;
  label?: string | undefined;
}

/** Optional self-reported performance metrics. */
export interface ISubmissionAnalytics {
  impressions?: number | undefined;
  reach?: number | undefined;
  likes?: number | undefined;
  comments?: number | undefined;
  shares?: number | undefined;
  saves?: number | undefined;
}

/** A creator's proof-of-work delivery for one (funded) contract. */
export interface ISubmission {
  contractId: Types.ObjectId;
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  assetType: AssetType;
  platform: Platform;
  /** 1-based attempt number; increments on each resubmission. */
  revision: number;
  status: SubmissionStatus;
  files: IDeliveryFile[];
  links: IDeliveryLink[];
  note?: string;
  analytics?: ISubmissionAnalytics;
  /** Brand's feedback on reject / revision. */
  reviewNote?: string;
  reviewedAt?: Date;
  submittedAt?: Date;
}

export interface ISubmissionDocument extends ISubmission, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ISubmissionModel = Model<ISubmissionDocument>;
