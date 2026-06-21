import type { ApplicationStatus, OfferStatus, Role } from "@/lib/api/types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export interface Offer {
  id: string;
  /** The party who made this offer. */
  sender: Extract<Role, "CREATOR" | "BRAND">;
  amount: number;
  message?: string;
  status: OfferStatus;
  at: string;
}

export interface Negotiation {
  id: string;
  campaignTitle: string;
  brandName: string;
  creatorName: string;
  assetType: string;
  platform: string;
  currency: string;
  status: ApplicationStatus;
  offers: Offer[];
  createdAt: string;
  updatedAt: string;
}

export const mockNegotiations: Negotiation[] = [
  {
    id: "neg_1", campaignTitle: "Summer Launch — Instagram Reel",
    brandName: "Northwind Studio", creatorName: "Maya Okonkwo",
    assetType: "Reel", platform: "Instagram", currency: "USD",
    status: "NEGOTIATING", createdAt: hoursAgo(30), updatedAt: hoursAgo(3),
    offers: [
      { id: "o1", sender: "CREATOR", amount: 150000, message: "Excited about this — here's my rate for one Reel with usage rights.", status: "COUNTERED", at: hoursAgo(30) },
      { id: "o2", sender: "BRAND", amount: 120000, message: "Love your work. Could we meet at this for the first collab?", status: "PENDING", at: hoursAgo(3) },
    ],
  },
  {
    id: "neg_2", campaignTitle: "App Install Sprint",
    brandName: "Hightide", creatorName: "Maya Okonkwo",
    assetType: "Short-form video", platform: "TikTok", currency: "USD",
    status: "PENDING", createdAt: hoursAgo(6), updatedAt: hoursAgo(6),
    offers: [
      { id: "o1", sender: "CREATOR", amount: 320000, message: "Proposed price for a 20s demo with a trackable link.", status: "PENDING", at: hoursAgo(6) },
    ],
  },
  {
    id: "neg_3", campaignTitle: "Holiday UGC Bundle",
    brandName: "Lumen", creatorName: "Maya Okonkwo",
    assetType: "UGC", platform: "TikTok", currency: "USD",
    status: "ACCEPTED", createdAt: hoursAgo(72), updatedAt: hoursAgo(20),
    offers: [
      { id: "o1", sender: "CREATOR", amount: 180000, message: "Three UGC clips, raw + edited.", status: "COUNTERED", at: hoursAgo(72) },
      { id: "o2", sender: "BRAND", amount: 160000, message: "Works for us at this rate.", status: "ACCEPTED", at: hoursAgo(20) },
    ],
  },
  {
    id: "neg_4", campaignTitle: "Q4 Ambassador Program",
    brandName: "Vertex", creatorName: "Maya Okonkwo",
    assetType: "Long-form video", platform: "YouTube", currency: "USD",
    status: "REJECTED", createdAt: hoursAgo(90), updatedAt: hoursAgo(48),
    offers: [
      { id: "o1", sender: "CREATOR", amount: 1500000, message: "Quarter-long ambassadorship rate.", status: "REJECTED", at: hoursAgo(90) },
    ],
  },
  {
    id: "neg_5", campaignTitle: "Unboxing Wave",
    brandName: "Crate & Co", creatorName: "Maya Okonkwo",
    assetType: "Short-form video", platform: "TikTok", currency: "USD",
    status: "NEGOTIATING", createdAt: hoursAgo(48), updatedAt: hoursAgo(8),
    offers: [
      { id: "o1", sender: "CREATOR", amount: 300000, message: "Unboxing with first impressions, 90-day usage.", status: "COUNTERED", at: hoursAgo(48) },
      { id: "o2", sender: "BRAND", amount: 250000, message: "Budget is tighter this quarter — could you do this?", status: "COUNTERED", at: hoursAgo(26) },
      { id: "o3", sender: "CREATOR", amount: 280000, message: "Meeting in the middle at this.", status: "PENDING", at: hoursAgo(8) },
    ],
  },
];
