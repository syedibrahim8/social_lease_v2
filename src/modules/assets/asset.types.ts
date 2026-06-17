import type { Document, Model, Types } from 'mongoose';
import type { Platform } from '@/modules/campaigns/campaign.types';
import type { VerificationState } from '@/types/verification';

/**
 * Asset Marketplace catalog.
 *
 * This is a richer, listing-oriented taxonomy than the campaign engagement
 * `ASSET_TYPES` (in `campaign.types.ts`) — it is intentionally SEPARATE so the
 * marketplace can grow without rippling through campaigns/applications/contracts/
 * submissions. `category` and the canonical `platform` are derived from the
 * asset type via the maps below (never trusted from the request body).
 */
export const ASSET_CATEGORIES = ['PROFILE_ASSETS', 'CONTENT_ASSETS', 'UGC_ASSETS'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const MARKETPLACE_ASSET_TYPES = [
  // PROFILE_ASSETS
  'LINKEDIN_BANNER',
  'LINKEDIN_FEATURED_POST',
  'X_HEADER',
  'X_PINNED_TWEET',
  'INSTAGRAM_BIO_LINK',
  'INSTAGRAM_PINNED_POST',
  'YOUTUBE_CHANNEL_BANNER',
  // CONTENT_ASSETS
  'INSTAGRAM_REEL',
  'INSTAGRAM_STORY',
  'YOUTUBE_SHORT',
  'YOUTUBE_VIDEO',
  'LINKEDIN_POST',
  'X_THREAD',
  // UGC_ASSETS
  'PRODUCT_REVIEW',
  'TESTIMONIAL_VIDEO',
  'PRODUCT_DEMO',
  'UNBOXING_VIDEO',
] as const;
export type MarketplaceAssetType = (typeof MARKETPLACE_ASSET_TYPES)[number];

/** assetType → category (the single source of truth; `category` is server-set). */
export const ASSET_TYPE_CATEGORY: Record<MarketplaceAssetType, AssetCategory> = {
  LINKEDIN_BANNER: 'PROFILE_ASSETS',
  LINKEDIN_FEATURED_POST: 'PROFILE_ASSETS',
  X_HEADER: 'PROFILE_ASSETS',
  X_PINNED_TWEET: 'PROFILE_ASSETS',
  INSTAGRAM_BIO_LINK: 'PROFILE_ASSETS',
  INSTAGRAM_PINNED_POST: 'PROFILE_ASSETS',
  YOUTUBE_CHANNEL_BANNER: 'PROFILE_ASSETS',
  INSTAGRAM_REEL: 'CONTENT_ASSETS',
  INSTAGRAM_STORY: 'CONTENT_ASSETS',
  YOUTUBE_SHORT: 'CONTENT_ASSETS',
  YOUTUBE_VIDEO: 'CONTENT_ASSETS',
  LINKEDIN_POST: 'CONTENT_ASSETS',
  X_THREAD: 'CONTENT_ASSETS',
  PRODUCT_REVIEW: 'UGC_ASSETS',
  TESTIMONIAL_VIDEO: 'UGC_ASSETS',
  PRODUCT_DEMO: 'UGC_ASSETS',
  UNBOXING_VIDEO: 'UGC_ASSETS',
};

/**
 * assetType → canonical platform. Type-locked assets (profile/content) are tied
 * to one network; UGC assets are platform-flexible (`null`) so the creator may
 * list them on any supported platform.
 */
export const ASSET_TYPE_PLATFORM: Record<MarketplaceAssetType, Platform | null> = {
  LINKEDIN_BANNER: 'LINKEDIN',
  LINKEDIN_FEATURED_POST: 'LINKEDIN',
  X_HEADER: 'TWITTER',
  X_PINNED_TWEET: 'TWITTER',
  INSTAGRAM_BIO_LINK: 'INSTAGRAM',
  INSTAGRAM_PINNED_POST: 'INSTAGRAM',
  YOUTUBE_CHANNEL_BANNER: 'YOUTUBE',
  INSTAGRAM_REEL: 'INSTAGRAM',
  INSTAGRAM_STORY: 'INSTAGRAM',
  YOUTUBE_SHORT: 'YOUTUBE',
  YOUTUBE_VIDEO: 'YOUTUBE',
  LINKEDIN_POST: 'LINKEDIN',
  X_THREAD: 'TWITTER',
  PRODUCT_REVIEW: null,
  TESTIMONIAL_VIDEO: null,
  PRODUCT_DEMO: null,
  UNBOXING_VIDEO: null,
};

/** Current bookability of an asset. */
export const AVAILABILITY_STATUSES = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export interface IAgeRange {
  range: string;
  percentage: number;
}
export interface IGenderSplit {
  male?: number | undefined;
  female?: number | undefined;
  other?: number | undefined;
}
export interface ICountryShare {
  country: string;
  percentage: number;
}

/**
 * Self-reported audience breakdown for the asset's channel. Optional fields are
 * `| undefined` to play nicely with `exactOptionalPropertyTypes` + Zod-parsed DTOs.
 */
export interface IAudienceDemographics {
  ageRanges?: IAgeRange[] | undefined;
  genderSplit?: IGenderSplit | undefined;
  topCountries?: ICountryShare[] | undefined;
  topCities?: string[] | undefined;
}

/** A blocked-out window on the availability calendar. */
export interface IAvailabilityBlock {
  _id?: Types.ObjectId | undefined;
  startDate: Date;
  endDate: Date;
  note?: string | undefined;
}

export interface IAvailability {
  status: AvailabilityStatus;
  leadTimeDays?: number | undefined;
  blocks: IAvailabilityBlock[];
}

/** A creator's listed social-media asset. */
export interface IAsset {
  creatorId: Types.ObjectId;
  assetType: MarketplaceAssetType;
  platform: Platform;
  category: AssetCategory;
  title: string;
  description: string;
  estimatedReach: number;
  averageViews: number;
  audienceDemographics?: IAudienceDemographics;
  availability: IAvailability;
  verificationStatus: VerificationState;
}

export interface IAssetDocument extends IAsset, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IAssetModel = Model<IAssetDocument>;

/** Aggregated analytics over a creator's assets. */
export interface IAssetAnalytics {
  totalAssets: number;
  totalEstimatedReach: number;
  averageViews: number;
  byCategory: Record<string, number>;
  byPlatform: Record<string, number>;
  byVerificationStatus: Record<string, number>;
  byAvailability: Record<string, number>;
}
