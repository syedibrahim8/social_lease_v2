import type { Document, Model, Types } from 'mongoose';

/**
 * Campaign lifecycle states. The brand drives the early transitions
 * (DRAFT → PUBLISHED here); later states are advanced by other modules
 * (applications/negotiation → NEGOTIATION, payments → FUNDED, submissions →
 * SUBMITTED/APPROVED, etc.).
 */
export const CAMPAIGN_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'NEGOTIATION',
  'FUNDED',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** A brand may edit a campaign's terms only before creators are engaged. */
export const EDITABLE_STATUSES: readonly CampaignStatus[] = ['DRAFT', 'PUBLISHED'];

/** A campaign may be deleted only before any money/work is committed. */
export const DELETABLE_STATUSES: readonly CampaignStatus[] = ['DRAFT', 'PUBLISHED', 'CANCELLED'];

/** Social asset being leased/produced. */
export const ASSET_TYPES = [
  'LINKEDIN_BANNER',
  'LINKEDIN_POST',
  'INSTAGRAM_REEL',
  'INSTAGRAM_STORY',
  'YOUTUBE_SHORT',
  'YOUTUBE_VIDEO',
  'TWITTER_PINNED_POST',
  'TWITTER_HEADER',
  'BIO_MENTION',
  'UGC_CONTENT',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const PLATFORMS = [
  'LINKEDIN',
  'INSTAGRAM',
  'YOUTUBE',
  'TWITTER',
  'FACEBOOK',
  'TIKTOK',
  'OTHER',
] as const;
export type Platform = (typeof PLATFORMS)[number];

/** The Campaign domain entity as stored in MongoDB. */
export interface ICampaign {
  /** Owning brand — references the brand User account. */
  brandId: Types.ObjectId;
  title: string;
  description: string;
  assetType: AssetType;
  platform: Platform;
  /** How long the asset stays live, in days. */
  duration: number;
  /** Budget range, stored in the smallest currency unit (e.g. cents). */
  budgetMin: number;
  budgetMax: number;
  currency: string;
  requirements: string[];
  status: CampaignStatus;
  publishedAt?: Date;
}

export interface ICampaignDocument extends ICampaign, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ICampaignModel = Model<ICampaignDocument>;
