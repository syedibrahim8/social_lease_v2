import type { IAssetAnalytics } from '@/modules/assets/asset.types';
import type { DeliveredAnalytics } from '@/modules/submissions/submission.repository';

/** Platform-wide dashboard (ADMIN). Money fields are minor units (cents). */
export interface PlatformAnalytics {
  currency: string;
  /** Gross Marketplace Volume — funded deal value (PAID + RELEASED). */
  gmv: number;
  /** Platform revenue — commission on released payouts. */
  totalRevenue: number;
  /** Creator funds currently held in escrow (PAID, not yet released). */
  escrowHeld: number;
  payments: { total: number; byStatus: Record<string, number> };
  totalTransactions: number;
  transactionsByType: Record<string, { count: number; amount: number }>;
  totalCampaigns: number;
  campaignsByStatus: Record<string, number>;
  totalContracts: number;
  contractsByStatus: Record<string, number>;
  users: { creators: number; brands: number; admins: number; total: number };
  /** Total earnings paid out to creators (wallet `totalEarned`). */
  creatorEarningsPaidOut: number;
  generatedAt: string;
}

/** Per-creator dashboard. */
export interface CreatorAnalytics {
  currency: string;
  earnings: {
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
    payoutCount: number;
  };
  conversion: { applications: number; accepted: number; conversionRate: number };
  deliveries: {
    total: number;
    approved: number;
    approvalRate: number;
    byStatus: Record<string, number>;
  };
  assetPerformance: IAssetAnalytics;
  delivered: DeliveredAnalytics;
  generatedAt: string;
}

/** Per-brand dashboard. */
export interface BrandAnalytics {
  currency: string;
  spend: { funded: number; refunded: number; net: number };
  campaigns: { total: number; byStatus: Record<string, number>; completionRate: number };
  applicationsReceived: number;
  contracts: { total: number; byStatus: Record<string, number> };
  /**
   * Delivery-based ROI proxy. The platform doesn't track the brand's downstream
   * sales, so "return" is the audience value delivered (impressions/reach/
   * engagement from APPROVED deliveries) relative to net spend.
   */
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
