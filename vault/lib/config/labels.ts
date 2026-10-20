import type {
  ApplicationStatus,
  AssetCategory,
  AssetType,
  CampaignStatus,
  ContractStatus,
  Platform,
  SubmissionStatus,
} from "@/lib/api/types";
import type { SocialNetwork } from "@/lib/api/endpoints/profiles";
import type {
  VerificationRequestStatus,
  VerificationType,
} from "@/lib/api/endpoints/verifications";

/**
 * Backend enums are SCREAMING_SNAKE. Screens show words.
 *
 * Centralised so a status reads identically everywhere — a contract that says
 * "Awaiting funding" on one screen and "PENDING_FUNDING" on another looks like
 * two different states to the person reading it.
 */

type Tone = "gold" | "positive" | "negative" | "warning" | "info" | "muted";

/**
 * Every map here is typed `Record<Enum, …>`, which means adding a member to the
 * enum in types.ts breaks the build until it is labelled. That is the guard: an
 * unlabelled status renders as a blank badge, and a blank badge is invisible in
 * review but obvious to a user.
 */
export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  LINKEDIN_BANNER: "LinkedIn header banner",
  LINKEDIN_FEATURED_POST: "LinkedIn featured post",
  X_HEADER: "X header",
  X_PINNED_POST: "X pinned post",
  INSTAGRAM_BIO_LINK: "Instagram bio link",
  INSTAGRAM_PINNED_POST: "Instagram pinned post",
  YOUTUBE_CHANNEL_BANNER: "YouTube channel banner",
  TIKTOK_BIO_LINK: "TikTok bio link",
  TIKTOK_PINNED_VIDEO: "TikTok pinned video",
  FACEBOOK_COVER: "Facebook cover",
  THREADS_PINNED_POST: "Threads pinned post",
  PINTEREST_BOARD: "Pinterest board",
  TWITCH_PANEL: "Twitch panel",
  INSTAGRAM_POST: "Instagram post",
  INSTAGRAM_CAROUSEL: "Instagram carousel",
  INSTAGRAM_REEL: "Instagram reel",
  INSTAGRAM_STORY: "Instagram story",
  YOUTUBE_VIDEO: "YouTube video",
  YOUTUBE_SHORT: "YouTube Short",
  YOUTUBE_VLOG: "YouTube vlog integration",
  LINKEDIN_POST: "LinkedIn post",
  X_POST: "X post",
  X_THREAD: "X thread",
  TIKTOK_VIDEO: "TikTok video",
  FACEBOOK_POST: "Facebook post",
  FACEBOOK_REEL: "Facebook reel",
  FACEBOOK_STORY: "Facebook story",
  THREADS_POST: "Threads post",
  PINTEREST_PIN: "Pinterest pin",
  SNAPCHAT_STORY: "Snapchat story",
  SNAPCHAT_SPOTLIGHT: "Snapchat Spotlight",
  TWITCH_STREAM_MENTION: "Twitch stream mention",
  PRODUCT_REVIEW: "Product review",
  TESTIMONIAL_VIDEO: "Testimonial video",
  PRODUCT_DEMO: "Product demo",
  UNBOXING_VIDEO: "Unboxing video",
};

export const ASSET_CATEGORY_LABEL: Record<AssetCategory, string> = {
  PROFILE_ASSETS: "Profile space",
  CONTENT_ASSETS: "Content",
  UGC_ASSETS: "UGC",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TWITTER: "X",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  THREADS: "Threads",
  PINTEREST: "Pinterest",
  SNAPCHAT: "Snapchat",
  TWITCH: "Twitch",
  OTHER: "Other",
};

export const SOCIAL_NETWORK_LABEL: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  threads: "Threads",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitch: "Twitch",
};

export const VERIFICATION_TYPE_LABEL: Record<
  VerificationType,
  { label: string; description: string }
> = {
  SOCIAL_PROFILE: {
    label: "Social profile",
    description: "Confirms your main channel is real and active.",
  },
  PROFILE_OWNERSHIP: {
    label: "Profile ownership",
    description: "Confirms the channel is yours, so brands know who they're paying.",
  },
  IDENTITY: { label: "Identity", description: "Confirms who you are with an ID document." },
  WEBSITE: { label: "Website", description: "Confirms your company owns its website." },
  BUSINESS_EMAIL: {
    label: "Business email",
    description: "Confirms you can be reached at a company address.",
  },
  COMPANY: { label: "Company", description: "Confirms the company is registered." },
};

export const VERIFICATION_REQUEST_STATUS: Record<
  VerificationRequestStatus,
  { label: string; tone: Tone }
> = {
  PENDING: { label: "In review", tone: "warning" },
  APPROVED: { label: "Verified", tone: "positive" },
  REJECTED: { label: "Not approved", tone: "negative" },
};

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "muted" },
  PUBLISHED: { label: "Open to applications", tone: "info" },
  NEGOTIATION: { label: "In negotiation", tone: "warning" },
  FUNDED: { label: "Funded", tone: "gold" },
  IN_PROGRESS: { label: "In progress", tone: "warning" },
  SUBMITTED: { label: "Awaiting review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "positive" },
  COMPLETED: { label: "Completed", tone: "positive" },
  DISPUTED: { label: "Disputed", tone: "negative" },
  CANCELLED: { label: "Cancelled", tone: "negative" },
};

export const CONTRACT_STATUS: Record<ContractStatus, { label: string; tone: Tone }> = {
  PENDING_FUNDING: { label: "Awaiting funding", tone: "warning" },
  FUNDED: { label: "Escrow funded", tone: "gold" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  SUBMITTED: { label: "Awaiting your review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "positive" },
  COMPLETED: { label: "Paid out", tone: "positive" },
  CANCELLED: { label: "Cancelled", tone: "negative" },
  DISPUTED: { label: "Disputed", tone: "negative" },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Awaiting reply", tone: "warning" },
  NEGOTIATING: { label: "Negotiating", tone: "info" },
  ACCEPTED: { label: "Accepted", tone: "positive" },
  REJECTED: { label: "Rejected", tone: "negative" },
  WITHDRAWN: { label: "Withdrawn", tone: "muted" },
};

export const SUBMISSION_STATUS: Record<SubmissionStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "muted" },
  SUBMITTED: { label: "Awaiting review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "positive" },
  REJECTED: { label: "Rejected", tone: "negative" },
  REVISION_REQUESTED: { label: "Revision requested", tone: "info" },
};
