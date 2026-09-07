import { apiGet, apiPatch } from "@/lib/api/client";
import type { VerificationState } from "@/lib/api/types";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

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
  metrics?: { followers?: number; engagementRate?: number };
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

export function updateMyCreatorProfile(
  input: Partial<Pick<CreatorProfile, "displayName" | "bio" | "niche" | "location">>,
): Promise<CreatorProfile> {
  return apiPatch<CreatorProfile>("/creators/me", input);
}

export function getMyBrandProfile(): Promise<BrandProfile> {
  return apiGet<BrandProfile>("/brands/me");
}

export function updateMyBrandProfile(
  input: Partial<
    Pick<BrandProfile, "companyName" | "website" | "industry" | "companySize" | "description">
  >,
): Promise<BrandProfile> {
  return apiPatch<BrandProfile>("/brands/me", input);
}
