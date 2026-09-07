import { apiFetch, apiGet, qs } from "@/lib/api/client";
import type { AssetType, Campaign, CampaignStatus, Paginated, Platform } from "@/lib/api/types";

export interface CampaignFilters {
  page?: number;
  limit?: number;
  assetType?: AssetType;
  platform?: Platform;
  /** Minor units, matching the backend. */
  minBudget?: number;
  maxBudget?: number;
  search?: string;
}

/** Public browse. The backend only ever returns PUBLISHED campaigns here. */
export async function getCampaigns(filters: CampaignFilters = {}): Promise<Paginated<Campaign>> {
  const { data, meta } = await apiFetch<Campaign[]>(`/campaigns${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

/** A brand's own campaigns, at every status including drafts. */
export async function getMyCampaigns(
  filters: { status?: CampaignStatus; page?: number; limit?: number } = {},
): Promise<Paginated<Campaign>> {
  const { data, meta } = await apiFetch<Campaign[]>(`/campaigns/mine${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

/** Throws ApiError 404 for a draft belonging to someone else. */
export function getCampaign(id: string): Promise<Campaign> {
  return apiGet<Campaign>(`/campaigns/${id}`);
}
