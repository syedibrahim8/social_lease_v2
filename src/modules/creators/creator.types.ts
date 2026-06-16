import type { Document, Model, Types } from 'mongoose';

// Shared verification states (used by `profileOwnershipStatus` — has the creator
// proven they control the linked social accounts? — and `verificationStatus` —
// has an admin vetted the profile?). System/admin controlled, never set by the
// creator. Re-exported so existing imports from this module keep working.
export { VERIFICATION_STATES } from '@/types/verification';
export type { VerificationState } from '@/types/verification';
import type { VerificationState } from '@/types/verification';

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
