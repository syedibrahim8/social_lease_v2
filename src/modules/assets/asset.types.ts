import type { Document, Model, Types } from 'mongoose';
import type { AssetCategory, AssetType, Platform } from '@/types/assets';
import type { VerificationState } from '@/types/verification';

/**
 * Asset listings use the platform-wide catalogue in `src/types/assets.ts`, the
 * same one campaigns use, so every listable asset can also be campaigned for.
 * `category` and the canonical platform are derived from the type, never taken
 * from the request body.
 */
export {
  ASSET_CATEGORIES,
  ASSET_TYPES,
  ASSET_TYPE_CATEGORY,
  ASSET_TYPE_PLATFORM,
} from '@/types/assets';
export type { AssetCategory, AssetType } from '@/types/assets';

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
  assetType: AssetType;
  platform: Platform;
  category: AssetCategory;
  title: string;
  description: string;
  estimatedReach: number;
  averageViews: number;
  /** Asking price in minor units (cents). Optional: a listing may be "ask me". */
  price?: number;
  currency: string;
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
