/** Filter option lists for the campaign + asset marketplaces. */

export const CAMPAIGN_PLATFORMS = ["Instagram", "TikTok", "YouTube", "X"] as const;

export const CAMPAIGN_ASSET_TYPES = [
  "Post",
  "Reel",
  "Story",
  "Short-form video",
  "Long-form video",
  "UGC",
] as const;

export const BUDGET_BUCKETS = [
  { value: "0-100000", label: "Under $1,000" },
  { value: "100000-300000", label: "$1,000 – $3,000" },
  { value: "300000-1000000", label: "$3,000 – $10,000" },
  { value: "1000000-", label: "$10,000+" },
] as const;

export const ASSET_CATEGORIES = ["Profile", "Content", "UGC"] as const;

export const MARKETPLACE_ASSET_TYPES = [
  "Profile feature",
  "Dedicated post",
  "Story series",
  "UGC video",
  "Product review",
  "Unboxing",
  "Brand ambassador",
] as const;

export const ASSET_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "LinkedIn",
  "Twitch",
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "BUSY", label: "Limited" },
  { value: "UNAVAILABLE", label: "Unavailable" },
] as const;

export const CAMPAIGN_SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "budget-desc", label: "Budget: high to low" },
  { value: "budget-asc", label: "Budget: low to high" },
] as const;

export const ASSET_SORTS = [
  { value: "reach-desc", label: "Reach: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
