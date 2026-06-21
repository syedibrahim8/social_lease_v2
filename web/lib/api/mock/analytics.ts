import type { SeriesPoint } from "@/lib/api/mock/dashboards";

export interface NamedValue {
  label: string;
  value: number;
}

export interface CreatorAnalytics {
  totals: {
    totalEarned: number;
    avgDealSize: number;
    completedDeals: number;
    repeatRate: number;
  };
  earnings: SeriesPoint[];
  byPlatform: NamedValue[];
  applications: SeriesPoint[];
  funnel: NamedValue[];
}

export interface BrandAnalytics {
  totals: {
    totalSpend: number;
    effectiveCpm: number;
    activeCampaigns: number;
    completionRate: number;
  };
  spend: SeriesPoint[];
  byPlatform: NamedValue[];
  applications: SeriesPoint[];
  campaignsByStatus: { status: string; count: number }[];
}

export interface PlatformAnalytics {
  totals: { gmv: number; revenue: number; escrow: number; takeRate: number };
  gmv: SeriesPoint[];
  txByType: NamedValue[];
  newUsers: SeriesPoint[];
  usersByRole: NamedValue[];
  contractsByStatus: { status: string; count: number }[];
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const series = (values: number[]): SeriesPoint[] =>
  values.map((value, i) => ({ label: months[i] ?? `M${i}`, value }));

export const creatorAnalytics: CreatorAnalytics = {
  totals: {
    totalEarned: 1284500,
    avgDealSize: 142700,
    completedDeals: 9,
    repeatRate: 0.34,
  },
  earnings: series([120000, 185000, 150000, 240000, 210000, 320000]),
  byPlatform: [
    { label: "Instagram", value: 520000 },
    { label: "TikTok", value: 410000 },
    { label: "YouTube", value: 240000 },
    { label: "X", value: 114500 },
  ],
  applications: series([6, 8, 5, 9, 7, 3]),
  funnel: [
    { label: "Applications", value: 38 },
    { label: "Accepted", value: 12 },
    { label: "Completed", value: 9 },
  ],
};

export const brandAnalytics: BrandAnalytics = {
  totals: {
    totalSpend: 1700000,
    effectiveCpm: 137,
    activeCampaigns: 5,
    completionRate: 0.5,
  },
  spend: series([300000, 250000, 480000, 360000, 520000, 610000]),
  byPlatform: [
    { label: "Instagram", value: 680000 },
    { label: "TikTok", value: 520000 },
    { label: "YouTube", value: 400000 },
    { label: "X", value: 100000 },
  ],
  applications: series([8, 12, 9, 14, 11, 10]),
  campaignsByStatus: [
    { status: "COMPLETED", count: 7 },
    { status: "PUBLISHED", count: 5 },
    { status: "NEGOTIATION", count: 2 },
  ],
};

export const platformAnalytics: PlatformAnalytics = {
  totals: { gmv: 4205000, revenue: 420500, escrow: 218000, takeRate: 0.1 },
  gmv: series([1850000, 2200000, 2050000, 3100000, 2800000, 4205000]),
  txByType: [
    { label: "Charges", value: 88 },
    { label: "Payouts", value: 36 },
    { label: "Commission", value: 10 },
    { label: "Refunds", value: 8 },
  ],
  newUsers: series([120, 180, 150, 240, 210, 320]),
  usersByRole: [
    { label: "Creators", value: 1240 },
    { label: "Brands", value: 318 },
    { label: "Admins", value: 4 },
  ],
  contractsByStatus: [
    { status: "COMPLETED", count: 58 },
    { status: "FUNDED", count: 14 },
    { status: "IN_PROGRESS", count: 11 },
    { status: "APPROVED", count: 9 },
    { status: "PENDING_FUNDING", count: 8 },
  ],
};
