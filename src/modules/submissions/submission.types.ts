import type { Document, Model, Types } from 'mongoose';
import type { AssetType, Platform } from '@/modules/campaigns/campaign.types';

/**
 * Submission lifecycle (proof of work against a FUNDED contract):
 *   PENDING            — creator submitted; awaiting the brand's review
 *   APPROVED           — brand accepted the work (gates the payout release)
 *   REVISION_REQUESTED — brand wants changes; the creator may resubmit
 *
 * At most ONE submission per contract is PENDING at a time (DB-enforced via a
 * partial-unique index). Approving advances the contract to APPROVED; requesting
 * a revision sends it back to IN_PROGRESS so the creator can submit a new round.
 */
export const SUBMISSION_STATUSES = ['PENDING', 'APPROVED', 'REVISION_REQUESTED'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * Optional self-reported performance metrics for the delivered asset. All fields
 * are `| undefined` to play nicely with `exactOptionalPropertyTypes` + Zod.
 */
export interface ISubmissionAnalytics {
  impressions?: number | undefined;
  reach?: number | undefined;
  likes?: number | undefined;
  comments?: number | undefined;
  shares?: number | undefined;
  saves?: number | undefined;
}

/** Proof of delivery a creator submits for a single contract. */
export interface ISubmission {
  contractId: Types.ObjectId;
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  assetType: AssetType;
  platform: Platform;
  /** 1-based attempt number; increments with each resubmission. */
  revision: number;
  note?: string;
  /** URL to the live post/asset. */
  liveUrl?: string;
  /** Screenshots / files (URLs; Cloudinary uploads slot in later). */
  mediaUrls: string[];
  analytics?: ISubmissionAnalytics;
  status: SubmissionStatus;
  /** Brand's feedback when a revision is requested. */
  reviewNote?: string;
  reviewedAt?: Date;
}

export interface ISubmissionDocument extends ISubmission, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ISubmissionModel = Model<ISubmissionDocument>;
