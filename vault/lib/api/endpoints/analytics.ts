import { apiGet, qs } from "@/lib/api/client";
import type { AssetAnalytics } from "@/lib/api/endpoints/assets";

/** Mirrors `analytics.types.ts`. Money is minor units; rates are 0–1. */
export interface PlatformAnalytics {
  currency: string;
  gmv: number;
  totalRevenue: number;
  escrowHeld: number;
  payments: { total: number; byStatus: Record<string, number> };
  totalTransactions: number;
  transactionsByType: Record<string, { count: number; amount: number }>;
  totalCampaigns: number;
  campaignsByStatus: Record<string, number>;
  totalContracts: number;
  contractsByStatus: Record<string, number>;
  users: { creators: number; brands: number; admins: number; total: number };
  creatorEarningsPaidOut: number;
  generatedAt: string;
}

export interface CreatorAnalytics {
  currency: string;
  earnings: { totalEarned: number; availableBalance: number; pendingBalance: number; payoutCount: number };
  conversion: { applications: number; accepted: number; conversionRate: number };
  deliveries: { total: number; approved: number; approvalRate: number; byStatus: Record<string, number> };
  assetPerformance: AssetAnalytics;
  delivered: {
    approvedCount: number;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  generatedAt: string;
}

export interface BrandAnalytics {
  currency: string;
  spend: { funded: number; refunded: number; net: number };
  campaigns: { total: number; byStatus: Record<string, number>; completionRate: number };
  applicationsReceived: number;
  contracts: { total: number; byStatus: Record<string, number> };
  roi: {
    netSpend: number;
    deliveredImpressions: number;
    deliveredReach: number;
    deliveredEngagement: number;
    impressionsPerDollar: number;
    effectiveCpmCents: number;
    note: string;
  };
  generatedAt: string;
}

/** ADMIN only. */
export function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  return apiGet<PlatformAnalytics>("/analytics/platform");
}

/** Your own dashboard; an admin passes the user to look at. */
export function getCreatorAnalytics(userId?: string): Promise<CreatorAnalytics> {
  return apiGet<CreatorAnalytics>(`/analytics/creator${qs({ userId })}`);
}

export function getBrandAnalytics(userId?: string): Promise<BrandAnalytics> {
  return apiGet<BrandAnalytics>(`/analytics/brand${qs({ userId })}`);
}
