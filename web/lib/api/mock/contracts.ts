import type { ContractStatus, SubmissionStatus } from "@/lib/api/types";
import type { ProofType } from "@/lib/config/contracts";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export interface ProofItem {
  id: string;
  type: ProofType;
  url: string;
  caption?: string;
}

export interface Submission {
  id: string;
  status: SubmissionStatus;
  revision: number;
  proof: ProofItem[];
  note?: string;
  reviewNote?: string;
  submittedAt?: string;
}

export interface Deliverable {
  description: string;
  completed: boolean;
}

export interface Contract {
  id: string;
  campaignTitle: string;
  brandName: string;
  creatorName: string;
  assetType: string;
  platform: string;
  agreedPrice: number;
  currency: string;
  status: ContractStatus;
  deliverables: Deliverable[];
  durationDays: number;
  createdAt: string;
  updatedAt: string;
  submission: Submission | null;
}

export const mockContracts: Contract[] = [
  {
    id: "ct_1", campaignTitle: "Holiday UGC Bundle", brandName: "Lumen",
    creatorName: "Maya Okonkwo", assetType: "UGC", platform: "TikTok",
    agreedPrice: 160000, currency: "USD", status: "FUNDED", durationDays: 10,
    createdAt: daysAgo(4), updatedAt: daysAgo(1),
    deliverables: [
      { description: "3 UGC videos (15s, vertical)", completed: false },
      { description: "Raw + edited delivery", completed: false },
    ],
    submission: null,
  },
  {
    id: "ct_2", campaignTitle: "Summer Launch — Instagram Reel", brandName: "Northwind Studio",
    creatorName: "Maya Okonkwo", assetType: "Reel", platform: "Instagram",
    agreedPrice: 150000, currency: "USD", status: "SUBMITTED", durationDays: 14,
    createdAt: daysAgo(9), updatedAt: daysAgo(1),
    deliverables: [
      { description: "1 Reel (30–45s)", completed: true },
      { description: "Product in first 3 seconds", completed: true },
      { description: "Link in bio for 7 days", completed: false },
    ],
    submission: {
      id: "sub_2", status: "SUBMITTED", revision: 0,
      submittedAt: daysAgo(1),
      note: "Posted the Reel this morning — early numbers look strong.",
      proof: [
        { id: "p1", type: "LINK", url: "https://instagram.com/reel/abc123", caption: "Published Reel" },
        { id: "p2", type: "ANALYTICS_SCREENSHOT", url: "https://example.com/analytics.png", caption: "24h insights" },
      ],
    },
  },
  {
    id: "ct_3", campaignTitle: "Spring Collection Reel", brandName: "Northwind Studio",
    creatorName: "Maya Okonkwo", assetType: "Reel", platform: "Instagram",
    agreedPrice: 175000, currency: "USD", status: "COMPLETED", durationDays: 14,
    createdAt: daysAgo(30), updatedAt: daysAgo(18),
    deliverables: [
      { description: "1 Reel", completed: true },
      { description: "Story re-share", completed: true },
    ],
    submission: {
      id: "sub_3", status: "APPROVED", revision: 0,
      submittedAt: daysAgo(20),
      note: "Final Reel + story re-share delivered.",
      proof: [{ id: "p1", type: "LINK", url: "https://instagram.com/reel/spring", caption: "Reel" }],
    },
  },
  {
    id: "ct_4", campaignTitle: "App Install Sprint", brandName: "Hightide",
    creatorName: "Maya Okonkwo", assetType: "Short-form video", platform: "TikTok",
    agreedPrice: 320000, currency: "USD", status: "PENDING_FUNDING", durationDays: 7,
    createdAt: daysAgo(1), updatedAt: daysAgo(1),
    deliverables: [
      { description: "1 short video (20s)", completed: false },
      { description: "Trackable link", completed: false },
    ],
    submission: null,
  },
  {
    id: "ct_5", campaignTitle: "Fitness Challenge Reel", brandName: "PulseFit",
    creatorName: "Maya Okonkwo", assetType: "Reel", platform: "Instagram",
    agreedPrice: 220000, currency: "USD", status: "IN_PROGRESS", durationDays: 12,
    createdAt: daysAgo(12), updatedAt: daysAgo(2),
    deliverables: [
      { description: "1 Reel", completed: true },
      { description: "Discount code in caption", completed: false },
    ],
    submission: {
      id: "sub_5", status: "REVISION_REQUESTED", revision: 1,
      submittedAt: daysAgo(4),
      reviewNote: "Great energy! Please add the discount code to the caption and re-share.",
      note: "First cut of the challenge Reel.",
      proof: [{ id: "p1", type: "LINK", url: "https://instagram.com/reel/fitness", caption: "Draft Reel" }],
    },
  },
];
