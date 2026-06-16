import type { Document, Model, Types } from 'mongoose';

/**
 * Verification states. Used by BOTH `profileOwnershipStatus` (has the creator
 * proven they control the linked social accounts?) and `verificationStatus`
 * (has an admin vetted the profile?). These are system/admin controlled — never
 * settable by the creator through profile create/update.
 */
export const VERIFICATION_STATES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface SocialLinks {
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
}

export interface CreatorMetrics {
  followers: number;
  engagementRate: number;
  averageReach: number;
}

export interface PortfolioCampaign {
  title: string;
  brandName?: string;
  description?: string;
  link?: string;
  completedAt?: Date;
}

export interface MediaItem {
  url: string;
  type: MediaType;
  caption?: string;
}

/** The CreatorProfile domain entity as stored in MongoDB. */
export interface ICreatorProfile {
  userId: Types.ObjectId;
  displayName: string;
  bio?: string;
  niche?: string;
  location?: string;
  profileImage?: string;
  socialLinks: SocialLinks;
  metrics: CreatorMetrics;
  profileOwnershipStatus: VerificationState;
  verificationStatus: VerificationState;
  previousCampaigns: PortfolioCampaign[];
  mediaGallery: MediaItem[];
}

export interface ICreatorProfileDocument extends ICreatorProfile, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ICreatorProfileModel = Model<ICreatorProfileDocument>;
