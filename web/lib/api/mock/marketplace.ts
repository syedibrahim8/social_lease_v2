import type { VerificationState } from "@/lib/api/types";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export interface Campaign {
  id: string;
  title: string;
  brandName: string;
  status: string;
  platform: string;
  assetType: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  description: string;
  requirements: string[];
  durationDays: number;
  applicants: number;
  postedAt: string;
  location: string;
}

export interface AssetListing {
  id: string;
  title: string;
  creatorName: string;
  category: string;
  assetType: string;
  platform: string;
  verificationStatus: VerificationState;
  availabilityStatus: "AVAILABLE" | "BUSY" | "UNAVAILABLE";
  estimatedReach: number;
  avgViews: number;
  engagementRate: number;
  price: number;
  currency: string;
  description: string;
  leadTimeDays: number;
  rating: number;
  reviews: number;
  /** Days of the current month that are blocked. */
  busyDays: number[];
}

export const mockCampaigns: Campaign[] = [
  {
    id: "cmp_1", title: "Summer Launch — Instagram Reel", brandName: "Northwind Studio",
    status: "PUBLISHED", platform: "Instagram", assetType: "Reel",
    budgetMin: 300000, budgetMax: 500000, currency: "USD",
    description: "Launch our summer collection with a high-energy Reel showcasing 3 hero products.",
    requirements: ["1 Reel (30–45s)", "Product in first 3 seconds", "Link in bio for 7 days"],
    durationDays: 14, applicants: 23, postedAt: daysAgo(2), location: "Remote",
  },
  {
    id: "cmp_2", title: "Holiday UGC Bundle", brandName: "Lumen",
    status: "PUBLISHED", platform: "TikTok", assetType: "UGC",
    budgetMin: 100000, budgetMax: 250000, currency: "USD",
    description: "Need 3 authentic UGC clips for paid social during the holiday push.",
    requirements: ["3 UGC videos (15s)", "Vertical 9:16", "Raw + edited delivery"],
    durationDays: 10, applicants: 41, postedAt: daysAgo(1), location: "Remote",
  },
  {
    id: "cmp_3", title: "Q4 Ambassador Program", brandName: "Vertex",
    status: "PUBLISHED", platform: "YouTube", assetType: "Long-form video",
    budgetMin: 800000, budgetMax: 1200000, currency: "USD",
    description: "Quarter-long ambassadorship with a dedicated long-form review and two follow-ups.",
    requirements: ["1 long-form video (8–12 min)", "30-day exclusivity", "2 community posts"],
    durationDays: 90, applicants: 12, postedAt: daysAgo(4), location: "US only",
  },
  {
    id: "cmp_4", title: "App Install Sprint", brandName: "Hightide",
    status: "PUBLISHED", platform: "TikTok", assetType: "Short-form video",
    budgetMin: 200000, budgetMax: 400000, currency: "USD",
    description: "Drive installs with a punchy demo of the onboarding flow.",
    requirements: ["1 short video (20s)", "Trackable link", "Usage rights 60 days"],
    durationDays: 7, applicants: 35, postedAt: daysAgo(1), location: "Remote",
  },
  {
    id: "cmp_5", title: "Brand Story Series", brandName: "Monarch",
    status: "PUBLISHED", platform: "Instagram", assetType: "Story",
    budgetMin: 80000, budgetMax: 150000, currency: "USD",
    description: "A 5-frame Story series telling our founding story with a swipe-up.",
    requirements: ["5 Story frames", "Swipe-up link", "Posted within 48h of approval"],
    durationDays: 5, applicants: 18, postedAt: daysAgo(3), location: "Remote",
  },
  {
    id: "cmp_6", title: "Product Review Push", brandName: "Cobalt",
    status: "PUBLISHED", platform: "YouTube", assetType: "Long-form video",
    budgetMin: 400000, budgetMax: 700000, currency: "USD",
    description: "Honest long-form review of our flagship product with timestamps.",
    requirements: ["1 review (6–10 min)", "Chapters", "Pinned comment with link"],
    durationDays: 21, applicants: 9, postedAt: daysAgo(6), location: "Remote",
  },
  {
    id: "cmp_7", title: "Fitness Challenge Reel", brandName: "PulseFit",
    status: "PUBLISHED", platform: "Instagram", assetType: "Reel",
    budgetMin: 150000, budgetMax: 300000, currency: "USD",
    description: "Kick off our 30-day challenge with a motivating Reel and a discount code.",
    requirements: ["1 Reel", "Discount code", "Story re-share"],
    durationDays: 12, applicants: 27, postedAt: daysAgo(2), location: "Remote",
  },
  {
    id: "cmp_8", title: "Fintech Explainer Thread", brandName: "Ledgerly",
    status: "PUBLISHED", platform: "X", assetType: "Post",
    budgetMin: 100000, budgetMax: 200000, currency: "USD",
    description: "A clear thread explaining how our escrow works for first-time users.",
    requirements: ["1 thread (6–8 posts)", "Plain-language tone", "Link to docs"],
    durationDays: 7, applicants: 14, postedAt: daysAgo(5), location: "Remote",
  },
  {
    id: "cmp_9", title: "Unboxing Wave", brandName: "Crate & Co",
    status: "PUBLISHED", platform: "TikTok", assetType: "Short-form video",
    budgetMin: 250000, budgetMax: 500000, currency: "USD",
    description: "Satisfying unboxing of our subscription box for a seasonal campaign.",
    requirements: ["1 unboxing video", "First impressions", "Usage rights 90 days"],
    durationDays: 14, applicants: 31, postedAt: daysAgo(3), location: "Remote",
  },
];

export const mockAssets: AssetListing[] = [
  {
    id: "ast_1", title: "Daily Tech Reels", creatorName: "Maya Okonkwo",
    category: "Content", assetType: "Dedicated post", platform: "Instagram",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 240000, avgViews: 86000, engagementRate: 0.048,
    price: 150000, currency: "USD",
    description: "High-retention tech Reels with a loyal, gadget-loving audience.",
    leadTimeDays: 5, rating: 4.9, reviews: 38, busyDays: [12, 13, 24],
  },
  {
    id: "ast_2", title: "Honest UGC Reviews", creatorName: "Devon Pierce",
    category: "UGC", assetType: "Product review", platform: "TikTok",
    verificationStatus: "VERIFIED", availabilityStatus: "BUSY",
    estimatedReach: 120000, avgViews: 52000, engagementRate: 0.061,
    price: 90000, currency: "USD",
    description: "Authentic, conversion-focused UGC product reviews for paid social.",
    leadTimeDays: 7, rating: 4.8, reviews: 52, busyDays: [3, 4, 5, 6, 18, 19, 20],
  },
  {
    id: "ast_3", title: "Founder Story Features", creatorName: "Aria Nwosu",
    category: "Profile", assetType: "Profile feature", platform: "LinkedIn",
    verificationStatus: "UNVERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 48000, avgViews: 21000, engagementRate: 0.034,
    price: 120000, currency: "USD",
    description: "Long-form founder spotlights for B2B and fintech brands.",
    leadTimeDays: 10, rating: 4.7, reviews: 14, busyDays: [],
  },
  {
    id: "ast_4", title: "Fitness Transformation Series", creatorName: "Theo Marsh",
    category: "Content", assetType: "Story series", platform: "Instagram",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 310000, avgViews: 104000, engagementRate: 0.052,
    price: 200000, currency: "USD",
    description: "Motivational fitness Story series with strong save and share rates.",
    leadTimeDays: 6, rating: 4.9, reviews: 61, busyDays: [9, 10, 27],
  },
  {
    id: "ast_5", title: "Gaming Shorts", creatorName: "Kai Renner",
    category: "Content", assetType: "UGC video", platform: "YouTube",
    verificationStatus: "VERIFIED", availabilityStatus: "UNAVAILABLE",
    estimatedReach: 540000, avgViews: 180000, engagementRate: 0.071,
    price: 320000, currency: "USD",
    description: "Punchy gaming Shorts with a young, highly engaged audience.",
    leadTimeDays: 8, rating: 4.8, reviews: 44, busyDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
  {
    id: "ast_6", title: "Beauty Unboxings", creatorName: "Sofia Bianchi",
    category: "UGC", assetType: "Unboxing", platform: "TikTok",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 175000, avgViews: 63000, engagementRate: 0.058,
    price: 110000, currency: "USD",
    description: "Aesthetic beauty unboxings with high first-impression conversion.",
    leadTimeDays: 5, rating: 4.9, reviews: 29, busyDays: [15, 16],
  },
  {
    id: "ast_7", title: "Travel Long-form", creatorName: "Noah Adeyemi",
    category: "Content", assetType: "Dedicated post", platform: "YouTube",
    verificationStatus: "UNVERIFIED", availabilityStatus: "BUSY",
    estimatedReach: 92000, avgViews: 41000, engagementRate: 0.039,
    price: 180000, currency: "USD",
    description: "Cinematic travel long-form with destination and gear tie-ins.",
    leadTimeDays: 14, rating: 4.6, reviews: 11, busyDays: [21, 22, 23, 24, 25],
  },
  {
    id: "ast_8", title: "Brand Ambassador — Lifestyle", creatorName: "Imani Cole",
    category: "Profile", assetType: "Brand ambassador", platform: "Instagram",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 420000, avgViews: 140000, engagementRate: 0.046,
    price: 450000, currency: "USD",
    description: "Quarter-long lifestyle ambassadorships with consistent on-brand content.",
    leadTimeDays: 12, rating: 5.0, reviews: 22, busyDays: [28, 29, 30],
  },
  {
    id: "ast_9", title: "Fintech Explainers", creatorName: "Lucas Vry",
    category: "UGC", assetType: "UGC video", platform: "X",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 65000, avgViews: 28000, engagementRate: 0.042,
    price: 95000, currency: "USD",
    description: "Plain-language fintech explainer videos that build trust fast.",
    leadTimeDays: 6, rating: 4.7, reviews: 18, busyDays: [11],
  },
];

/** The current brand's own campaigns (mixed statuses) for /campaigns/mine. */
export const myCampaigns: Campaign[] = [
  {
    id: "mine_c1", title: "Spring Collection Reel", brandName: "Northwind Studio",
    status: "PUBLISHED", platform: "Instagram", assetType: "Reel",
    budgetMin: 300000, budgetMax: 500000, currency: "USD",
    description: "Showcase the spring drop in a high-energy Reel.",
    requirements: ["1 Reel", "Link in bio"], durationDays: 14, applicants: 18,
    postedAt: daysAgo(3), location: "Remote",
  },
  {
    id: "mine_c2", title: "Newsletter Shoutout", brandName: "Northwind Studio",
    status: "DRAFT", platform: "X", assetType: "Post",
    budgetMin: 50000, budgetMax: 100000, currency: "USD",
    description: "A single post highlighting our newsletter.",
    requirements: ["1 post"], durationDays: 3, applicants: 0,
    postedAt: daysAgo(1), location: "Remote",
  },
  {
    id: "mine_c3", title: "Founder Interview", brandName: "Northwind Studio",
    status: "NEGOTIATION", platform: "YouTube", assetType: "Long-form video",
    budgetMin: 200000, budgetMax: 400000, currency: "USD",
    description: "A long-form founder interview for our channel.",
    requirements: ["1 interview (10 min)"], durationDays: 21, applicants: 6,
    postedAt: daysAgo(8), location: "US only",
  },
  {
    id: "mine_c4", title: "Holiday Bundle UGC", brandName: "Northwind Studio",
    status: "COMPLETED", platform: "TikTok", assetType: "UGC",
    budgetMin: 150000, budgetMax: 300000, currency: "USD",
    description: "Authentic UGC for our holiday bundle.",
    requirements: ["3 UGC clips"], durationDays: 10, applicants: 24,
    postedAt: daysAgo(40), location: "Remote",
  },
];

/** The current creator's own asset listings for /assets/mine. */
export const myAssets: AssetListing[] = [
  {
    id: "mine_a1", title: "Daily Tech Reels", creatorName: "Maya Okonkwo",
    category: "Content", assetType: "Dedicated post", platform: "Instagram",
    verificationStatus: "VERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 240000, avgViews: 86000, engagementRate: 0.048,
    price: 150000, currency: "USD",
    description: "High-retention tech Reels with a loyal audience.",
    leadTimeDays: 5, rating: 4.9, reviews: 38, busyDays: [12, 13, 24],
  },
  {
    id: "mine_a2", title: "Tech Unboxings", creatorName: "Maya Okonkwo",
    category: "UGC", assetType: "Unboxing", platform: "TikTok",
    verificationStatus: "VERIFIED", availabilityStatus: "BUSY",
    estimatedReach: 132000, avgViews: 58000, engagementRate: 0.055,
    price: 110000, currency: "USD",
    description: "Crisp, satisfying tech unboxings for paid social.",
    leadTimeDays: 6, rating: 4.8, reviews: 21, busyDays: [3, 4, 5, 18],
  },
  {
    id: "mine_a3", title: "Founder Q&A Stories", creatorName: "Maya Okonkwo",
    category: "Profile", assetType: "Story series", platform: "Instagram",
    verificationStatus: "UNVERIFIED", availabilityStatus: "AVAILABLE",
    estimatedReach: 64000, avgViews: 24000, engagementRate: 0.037,
    price: 80000, currency: "USD",
    description: "Behind-the-scenes founder Q&A Story series.",
    leadTimeDays: 4, rating: 4.7, reviews: 9, busyDays: [],
  },
];
