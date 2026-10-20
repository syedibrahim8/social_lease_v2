import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type { VerificationState } from "@/lib/api/types";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

/** Profile links, one per network. Mirrors the backend's socialLinks schema. */
export const SOCIAL_NETWORKS = [
  "instagram",
  "tiktok",
  "youtube",
  "twitter",
  "linkedin",
  "facebook",
  "threads",
  "pinterest",
  "snapchat",
  "twitch",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type SocialLinks = Partial<Record<SocialNetwork, string>>;

export interface CreatorMetrics {
  followers?: number;
  /** Percent, 0–100. */
  engagementRate?: number;
  averageReach?: number;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  niche?: string;
  location?: string;
  profileImage?: string;
  /** Admin-controlled. Rejected from update bodies by the backend's .strict(). */
  verificationStatus: VerificationState;
  profileOwnershipStatus: VerificationState;
  socialLinks?: SocialLinks;
  metrics?: CreatorMetrics;
}

export interface BrandProfile {
  id: string;
  userId: string;
  companyName: string;
  logo?: string;
  website?: string;
  industry?: string;
  companySize?: CompanySize;
  description?: string;
  /** Admin-controlled, same as above. */
  verifiedStatus: VerificationState;
}

/** 404 when the profile has not been created yet — a real, expected state. */
export function getMyCreatorProfile(): Promise<CreatorProfile> {
  return apiGet<CreatorProfile>("/creators/me");
}

export type CreatorProfileInput = Partial<
  Pick<CreatorProfile, "displayName" | "bio" | "niche" | "location" | "profileImage">
> & { socialLinks?: SocialLinks; metrics?: CreatorMetrics };

export type BrandProfileInput = Partial<
  Pick<BrandProfile, "companyName" | "logo" | "website" | "industry" | "companySize" | "description">
>;

/** 409 when the user already has one (one profile per user). */
export function createCreatorProfile(
  input: CreatorProfileInput & { displayName: string },
): Promise<CreatorProfile> {
  return apiPost<CreatorProfile>("/creators", input);
}

export function createBrandProfile(
  input: BrandProfileInput & { companyName: string },
): Promise<BrandProfile> {
  return apiPost<BrandProfile>("/brands", input);
}

export function updateMyCreatorProfile(input: CreatorProfileInput): Promise<CreatorProfile> {
  return apiPatch<CreatorProfile>("/creators/me", input);
}

export function getMyBrandProfile(): Promise<BrandProfile> {
  return apiGet<BrandProfile>("/brands/me");
}

export function updateMyBrandProfile(input: BrandProfileInput): Promise<BrandProfile> {
  return apiPatch<BrandProfile>("/brands/me", input);
}
