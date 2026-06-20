/** Shared select/option lists used by onboarding, marketplace filters, etc. */

export const NICHES = [
  "Technology",
  "Fashion",
  "Beauty",
  "Fitness",
  "Food & Drink",
  "Travel",
  "Gaming",
  "Finance",
  "Lifestyle",
  "Education",
  "Music",
  "Comedy",
] as const;

export const PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "LinkedIn",
  "Twitch",
  "Facebook",
  "Pinterest",
] as const;

export const INDUSTRIES = [
  "Technology",
  "Retail & E-commerce",
  "Fashion",
  "Beauty",
  "Food & Beverage",
  "Health & Fitness",
  "Finance",
  "Travel & Hospitality",
  "Gaming",
  "Media & Entertainment",
  "Education",
  "Other",
] as const;

export const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
] as const;
