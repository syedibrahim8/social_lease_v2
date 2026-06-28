import { apiFetch } from "../client";
import { liveFirst, mockDelay } from "../adapter";
import {
  mockAssets,
  mockCampaigns,
  myAssets,
  myCampaigns,
  type AssetListing,
  type Campaign,
} from "../mock/marketplace";

/* ---- Backend → frontend mappers (campaigns are live-wired) ---- */

interface BackendCampaign {
  id: string;
  brandId: string | { name?: string };
  title: string;
  description: string;
  assetType: string;
  platform: string;
  duration: number;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  requirements?: string[];
  status: string;
  publishedAt?: string;
  createdAt?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  TWITTER: "X",
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  OTHER: "Other",
};

function platformLabel(value: string): string {
  return PLATFORM_LABELS[value] ?? value;
}

function humanizeType(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function mapCampaign(c: BackendCampaign): Campaign {
  const brandName =
    typeof c.brandId === "object" && c.brandId ? (c.brandId.name ?? "Brand") : "Brand";
  return {
    id: c.id,
    title: c.title,
    brandName,
    status: c.status,
    platform: platformLabel(c.platform),
    assetType: humanizeType(c.assetType),
    budgetMin: c.budgetMin,
    budgetMax: c.budgetMax,
    currency: c.currency ?? "USD",
    description: c.description,
    requirements: c.requirements ?? [],
    durationDays: c.duration,
    applicants: 0,
    postedAt: c.publishedAt ?? c.createdAt ?? new Date().toISOString(),
    location: "Remote",
  };
}

interface BackendAsset {
  id: string;
  creatorId: string | { name?: string };
  assetType: string;
  platform: string;
  category: string;
  title: string;
  description: string;
  estimatedReach: number;
  averageViews: number;
  availability?: {
    status?: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
    leadTimeDays?: number;
  };
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
}

const CATEGORY_LABELS: Record<string, string> = {
  PROFILE_ASSETS: "Profile",
  CONTENT_ASSETS: "Content",
  UGC_ASSETS: "UGC",
};

function mapAsset(a: BackendAsset): AssetListing {
  const creatorName =
    typeof a.creatorId === "object" && a.creatorId
      ? (a.creatorId.name ?? "Creator")
      : "Creator";
  return {
    id: a.id,
    title: a.title,
    creatorName,
    category: CATEGORY_LABELS[a.category] ?? a.category,
    assetType: humanizeType(a.assetType),
    platform: platformLabel(a.platform),
    verificationStatus: a.verificationStatus === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
    availabilityStatus: a.availability?.status ?? "AVAILABLE",
    estimatedReach: a.estimatedReach,
    avgViews: a.averageViews,
    engagementRate: 0,
    price: 0,
    currency: "USD",
    description: a.description,
    leadTimeDays: a.availability?.leadTimeDays ?? 0,
    rating: 0,
    reviews: 0,
    busyDays: [],
  };
}

/* ---- Endpoints ---- */

export function getCampaigns(): Promise<Campaign[]> {
  return liveFirst(
    async () => {
      await mockDelay();
      return mockCampaigns;
    },
    async () => {
      const { data } = await apiFetch<BackendCampaign[]>("/campaigns");
      return data.map(mapCampaign);
    },
  );
}

export function getAssets(): Promise<AssetListing[]> {
  return liveFirst(
    async () => {
      await mockDelay();
      return mockAssets;
    },
    async () => {
      const { data } = await apiFetch<BackendAsset[]>("/assets");
      return data.map(mapAsset);
    },
  );
}

export function getMyCampaigns(): Promise<Campaign[]> {
  return liveFirst(
    async () => {
      await mockDelay();
      return myCampaigns;
    },
    async () => {
      const { data } = await apiFetch<BackendCampaign[]>("/campaigns/mine");
      return data.map(mapCampaign);
    },
  );
}

export function getMyAssets(): Promise<AssetListing[]> {
  return liveFirst(
    async () => {
      await mockDelay();
      return myAssets;
    },
    async () => {
      const { data } = await apiFetch<BackendAsset[]>("/assets/mine");
      return data.map(mapAsset);
    },
  );
}
