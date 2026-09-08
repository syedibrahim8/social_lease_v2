import type {
  ApplicationStatus,
  AssetType,
  CampaignStatus,
  ContractStatus,
  Platform,
  SubmissionStatus,
} from "@/lib/api/types";

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
  LINKEDIN_BANNER: "LinkedIn banner",
  LINKEDIN_POST: "LinkedIn post",
  INSTAGRAM_REEL: "Instagram reel",
  INSTAGRAM_STORY: "Instagram story",
  YOUTUBE_SHORT: "YouTube short",
  YOUTUBE_VIDEO: "YouTube video",
  TWITTER_PINNED_POST: "Pinned post",
  TWITTER_HEADER: "Twitter header",
  BIO_MENTION: "Bio mention",
  UGC_CONTENT: "UGC content",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TWITTER: "Twitter",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  OTHER: "Other",
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
