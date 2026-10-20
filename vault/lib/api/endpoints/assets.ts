import { apiFetch, apiGet, qs } from "@/lib/api/client";
import type { AssetCategory, AssetType, Paginated, Platform } from "@/lib/api/types";

/**
 * Listings use the same asset catalogue as campaigns (see lib/api/types.ts),
 * so a brand can campaign for anything a creator can list.
 */
export type { AssetCategory } from "@/lib/api/types";

export const AVAILABILITY_STATUSES = ["AVAILABLE", "BUSY", "UNAVAILABLE"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export interface AssetListing {
  id: string;
  creatorId: string | { id: string; name: string; avatar?: string };
  title: string;
  description: string;
  category: AssetCategory;
  assetType: AssetType;
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
    blocks?: AvailabilityBlock[];
  };
  createdAt: string;
  updatedAt: string;
}

/** Calendar blocks keep Mongo's `_id` (the subdocument skips toJSON). */
export interface AvailabilityBlock {
  _id: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface AssetFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: AssetCategory;
  platform?: Platform;
  availabilityStatus?: AvailabilityStatus;
  minReach?: number;
  maxPrice?: number;
  assetType?: AssetType;
  creatorId?: string;
}

export async function getAssets(filters: AssetFilters = {}): Promise<Paginated<AssetListing>> {
  const { data, meta } = await apiFetch<AssetListing[]>(`/assets${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

export function getAsset(id: string): Promise<AssetListing> {
  return apiGet<AssetListing>(`/assets/${id}`);
}
