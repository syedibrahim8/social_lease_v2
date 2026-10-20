import { apiDelete, apiFetch, apiGet, apiPatch, apiPost, qs } from "@/lib/api/client";
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
  audienceDemographics?: AudienceDemographics;
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

export interface AudienceDemographics {
  genderSplit?: { male?: number; female?: number; other?: number };
  topCountries?: { country: string; percentage: number }[];
  topCities?: string[];
}

/** What a creator writes. Category and verification are server-owned. */
export interface AssetInput {
  assetType: AssetType;
  platform: Platform;
  title: string;
  description: string;
  estimatedReach?: number;
  averageViews?: number;
  /** Minor units. */
  price?: number;
  currency?: string;
  audienceDemographics?: AudienceDemographics;
  availability?: { status?: AvailabilityStatus; leadTimeDays?: number };
}

export function createAsset(input: AssetInput): Promise<AssetListing> {
  return apiPost<AssetListing>("/assets", input);
}

export function updateAsset(id: string, input: Partial<AssetInput>): Promise<AssetListing> {
  return apiPatch<AssetListing>(`/assets/${id}`, input);
}

export function deleteAsset(id: string): Promise<null> {
  return apiDelete<null>(`/assets/${id}`);
}

export async function getMyAssets(filters: AssetFilters = {}): Promise<Paginated<AssetListing>> {
  const { data, meta } = await apiFetch<AssetListing[]>(`/assets/mine${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

export interface AssetAnalytics {
  totalAssets: number;
  totalEstimatedReach: number;
  averageViews: number;
  byCategory: Record<string, number>;
  byPlatform: Record<string, number>;
  byVerificationStatus: Record<string, number>;
  byAvailability: Record<string, number>;
}

export function getAssetAnalytics(): Promise<AssetAnalytics> {
  return apiGet<AssetAnalytics>("/assets/analytics");
}

export interface Availability {
  status: AvailabilityStatus;
  leadTimeDays?: number;
  blocks: AvailabilityBlock[];
}

export function getAvailability(id: string): Promise<Availability> {
  return apiGet<Availability>(`/assets/${id}/availability`);
}

/** 409 when the window overlaps an existing block. Returns the whole listing. */
export function addAvailabilityBlock(
  id: string,
  block: { startDate: string; endDate: string; note?: string },
): Promise<AssetListing> {
  return apiPost<AssetListing>(`/assets/${id}/availability/blocks`, block);
}

export function removeAvailabilityBlock(id: string, blockId: string): Promise<AssetListing> {
  return apiDelete<AssetListing>(`/assets/${id}/availability/blocks/${blockId}`);
}
