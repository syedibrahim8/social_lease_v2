import { apiFetch, apiGet, qs } from "@/lib/api/client";
import type { Paginated, Platform } from "@/lib/api/types";

/**
 * The marketplace taxonomy is deliberately richer than the campaign one, and
 * separate from it, so listings can evolve without rippling through campaigns,
 * applications, contracts and submissions.
 */
export const ASSET_CATEGORIES = ["PROFILE", "CONTENT", "UGC"] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const AVAILABILITY_STATUSES = ["AVAILABLE", "BUSY", "UNAVAILABLE"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export interface AssetListing {
  id: string;
  creatorId: string | { id: string; name: string; avatar?: string };
  title: string;
  description: string;
  category: AssetCategory;
  assetType: string;
  platform: Platform;
  /** Minor units. */
  price?: number;
  currency?: string;
  estimatedReach?: number;
  averageViews?: number;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  availability: {
    status: AvailabilityStatus;
    leadTimeDays?: number;
    blocks?: { _id: string; from: string; to: string; reason?: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: AssetCategory;
  platform?: Platform;
  availabilityStatus?: AvailabilityStatus;
  minReach?: number;
  creatorId?: string;
}

export async function getAssets(filters: AssetFilters = {}): Promise<Paginated<AssetListing>> {
  const { data, meta } = await apiFetch<AssetListing[]>(`/assets${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

export function getAsset(id: string): Promise<AssetListing> {
  return apiGet<AssetListing>(`/assets/${id}`);
}
