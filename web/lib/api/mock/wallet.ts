import type { PaymentStatus } from "@/lib/api/types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export interface CreatorWallet {
  stripeConnected: boolean;
  payoutsEnabled: boolean;
  stripeAccountId: string;
  available: number;
  pending: number;
  totalEarned: number;
  payoutsCount: number;
  currency: string;
}

export interface BrandWallet {
  totalFunded: number;
  inEscrow: number;
  refunded: number;
  netSpend: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: "EARNING" | "PAYOUT" | "COMMISSION" | "CHARGE" | "REFUND";
  description: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  direction: "in" | "out";
  createdAt: string;
}

export const creatorWallet: CreatorWallet = {
  stripeConnected: true,
  payoutsEnabled: true,
  stripeAccountId: "acct_1HqWmaG2x9",
  available: 842300,
  pending: 218000,
  totalEarned: 1284500,
  payoutsCount: 9,
  currency: "USD",
};

export const brandWallet: BrandWallet = {
  totalFunded: 1820000,
  inEscrow: 218000,
  refunded: 120000,
  netSpend: 1700000,
  currency: "USD",
};

export const creatorTransactions: Transaction[] = [
  { id: "t1", type: "PAYOUT", description: "Payout · Spring Collection Reel", amount: 157500, currency: "USD", status: "RELEASED", direction: "in", createdAt: hoursAgo(20) },
  { id: "t2", type: "COMMISSION", description: "Platform commission · Spring Collection", amount: 17500, currency: "USD", status: "RELEASED", direction: "out", createdAt: hoursAgo(20) },
  { id: "t3", type: "EARNING", description: "Escrow funded · Summer Launch", amount: 135000, currency: "USD", status: "PAID", direction: "in", createdAt: hoursAgo(28) },
  { id: "t4", type: "PAYOUT", description: "Payout · Holiday UGC Bundle", amount: 144000, currency: "USD", status: "RELEASED", direction: "in", createdAt: hoursAgo(52) },
  { id: "t5", type: "REFUND", description: "Refund · Cancelled contract", amount: 90000, currency: "USD", status: "REFUNDED", direction: "out", createdAt: hoursAgo(96) },
  { id: "t6", type: "EARNING", description: "Escrow funded · Fitness Challenge", amount: 198000, currency: "USD", status: "PAID", direction: "in", createdAt: hoursAgo(120) },
];

export const brandTransactions: Transaction[] = [
  { id: "b1", type: "CHARGE", description: "Funded contract · Summer Launch", amount: 150000, currency: "USD", status: "PAID", direction: "out", createdAt: hoursAgo(28) },
  { id: "b2", type: "CHARGE", description: "Funded contract · Holiday UGC Bundle", amount: 160000, currency: "USD", status: "PAID", direction: "out", createdAt: hoursAgo(50) },
  { id: "b3", type: "REFUND", description: "Refund · App Demo (cancelled)", amount: 120000, currency: "USD", status: "REFUNDED", direction: "in", createdAt: hoursAgo(72) },
  { id: "b4", type: "CHARGE", description: "Funded contract · Q4 Ambassador", amount: 1000000, currency: "USD", status: "PAID", direction: "out", createdAt: hoursAgo(100) },
  { id: "b5", type: "CHARGE", description: "Funded contract · Spring Collection", amount: 175000, currency: "USD", status: "RELEASED", direction: "out", createdAt: hoursAgo(150) },
];
