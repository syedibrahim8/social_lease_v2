import type { StatusDomain } from "@/lib/config/status-maps";

/** Mock dashboard payloads mirroring the backend analytics module shapes.
 *  All money is integer minor units (cents). */

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  domain: StatusDomain;
  status: string;
  amount?: number;
  at: string;
}

export interface CreatorDashboard {
  earnings: {
    available: number;
    pending: number;
    totalEarned: number;
    payouts: number;
  };
  conversion: { applications: number; accepted: number; rate: number };
  delivery: { approved: number; total: number; approvalRate: number; pendingReview: number };
  activeContracts: number;
  volume: SeriesPoint[];
  recent: ActivityItem[];
}

export interface BrandDashboard {
  spend: { funded: number; refunded: number; net: number; inEscrow: number };
  campaigns: { total: number; published: number; completed: number; completionRate: number };
  applicationsReceived: number;
  contracts: number;
  roi: { impressions: number; effectiveCpm: number };
  spendSeries: SeriesPoint[];
  recent: ActivityItem[];
}

export interface AdminDashboard {
  gmv: number;
  revenue: number;
  escrowHeld: number;
  totalTransactions: number;
  users: { creators: number; brands: number; admins: number; total: number };
  campaignsByStatus: { status: string; count: number }[];
  contractsByStatus: { status: string; count: number }[];
  gmvSeries: SeriesPoint[];
  recent: ActivityItem[];
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const series = (values: number[]): SeriesPoint[] =>
  values.map((value, i) => ({ label: months[i] ?? `M${i}`, value }));

export const creatorDashboard: CreatorDashboard = {
  earnings: { available: 842300, pending: 218000, totalEarned: 1284500, payouts: 9 },
  conversion: { applications: 38, accepted: 12, rate: 0.316 },
  delivery: { approved: 21, total: 24, approvalRate: 0.875, pendingReview: 2 },
  activeContracts: 6,
  volume: series([120000, 185000, 150000, 240000, 210000, 320000]),
  recent: [
    { id: "a1", title: "Payment released · Summer Launch", domain: "payment", status: "RELEASED", amount: 135000, at: hoursAgo(4) },
    { id: "a2", title: "Delivery approved · Holiday UGC", domain: "submission", status: "APPROVED", at: hoursAgo(9) },
    { id: "a3", title: "Offer accepted · Northwind", domain: "offer", status: "ACCEPTED", amount: 150000, at: hoursAgo(26) },
    { id: "a4", title: "New application sent · Q4 Ambassador", domain: "application", status: "PENDING", at: hoursAgo(50) },
  ],
};

export const brandDashboard: BrandDashboard = {
  spend: { funded: 1820000, refunded: 120000, net: 1700000, inEscrow: 218000 },
  campaigns: { total: 14, published: 5, completed: 7, completionRate: 0.5 },
  applicationsReceived: 64,
  contracts: 9,
  roi: { impressions: 1240000, effectiveCpm: 137 },
  spendSeries: series([300000, 250000, 480000, 360000, 520000, 610000]),
  recent: [
    { id: "b1", title: "Application received · Maya Okonkwo", domain: "application", status: "PENDING", at: hoursAgo(2) },
    { id: "b2", title: "Contract funded · Summer Launch", domain: "contract", status: "FUNDED", amount: 500000, at: hoursAgo(7) },
    { id: "b3", title: "Delivery submitted · Holiday UGC", domain: "submission", status: "SUBMITTED", at: hoursAgo(20) },
    { id: "b4", title: "Campaign published · Q4 Ambassador", domain: "campaign", status: "PUBLISHED", at: hoursAgo(44) },
  ],
};

export const adminDashboard: AdminDashboard = {
  gmv: 4205000,
  revenue: 420500,
  escrowHeld: 218000,
  totalTransactions: 142,
  users: { creators: 1240, brands: 318, admins: 4, total: 1562 },
  campaignsByStatus: [
    { status: "COMPLETED", count: 64 },
    { status: "PUBLISHED", count: 42 },
    { status: "DRAFT", count: 23 },
    { status: "NEGOTIATION", count: 18 },
    { status: "FUNDED", count: 12 },
    { status: "CANCELLED", count: 7 },
  ],
  contractsByStatus: [
    { status: "COMPLETED", count: 58 },
    { status: "FUNDED", count: 14 },
    { status: "IN_PROGRESS", count: 11 },
    { status: "APPROVED", count: 9 },
    { status: "PENDING_FUNDING", count: 8 },
    { status: "CANCELLED", count: 6 },
  ],
  gmvSeries: series([1850000, 2200000, 2050000, 3100000, 2800000, 4205000]),
  recent: [
    { id: "x1", title: "Payout released · contract_8Hq2", domain: "payment", status: "RELEASED", amount: 135000, at: hoursAgo(1) },
    { id: "x2", title: "Verification approved · Lumen", domain: "verification", status: "APPROVED", at: hoursAgo(5) },
    { id: "x3", title: "Refund processed · contract_3Kp9", domain: "payment", status: "REFUNDED", amount: 120000, at: hoursAgo(12) },
    { id: "x4", title: "Campaign completed · Vertex Q3", domain: "campaign", status: "COMPLETED", at: hoursAgo(30) },
  ],
};
