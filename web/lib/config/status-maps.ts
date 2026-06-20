/**
 * Single source of truth mapping EVERY backend status enum → a human label +
 * a semantic tone. Drives <StatusBadge>, so status colors stay identical
 * across campaigns, applications, contracts, payments, submissions, and
 * verifications platform-wide. Tones resolve to the design tokens.
 */

export type StatusTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type StatusDomain =
  | "campaign"
  | "application"
  | "offer"
  | "contract"
  | "payment"
  | "submission"
  | "verification"
  | "verificationState";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const maps: Record<StatusDomain, Record<string, StatusMeta>> = {
  campaign: {
    DRAFT: { label: "Draft", tone: "neutral" },
    PUBLISHED: { label: "Published", tone: "brand" },
    NEGOTIATION: { label: "In negotiation", tone: "warning" },
    FUNDED: { label: "Funded", tone: "info" },
    COMPLETED: { label: "Completed", tone: "success" },
    CANCELLED: { label: "Cancelled", tone: "danger" },
  },
  application: {
    PENDING: { label: "Pending", tone: "neutral" },
    NEGOTIATING: { label: "Negotiating", tone: "warning" },
    ACCEPTED: { label: "Accepted", tone: "success" },
    REJECTED: { label: "Rejected", tone: "danger" },
    WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
  },
  offer: {
    PENDING: { label: "Pending", tone: "warning" },
    ACCEPTED: { label: "Accepted", tone: "success" },
    REJECTED: { label: "Rejected", tone: "danger" },
    COUNTERED: { label: "Countered", tone: "info" },
  },
  contract: {
    PENDING_FUNDING: { label: "Pending funding", tone: "warning" },
    FUNDED: { label: "Funded", tone: "info" },
    IN_PROGRESS: { label: "In progress", tone: "info" },
    SUBMITTED: { label: "Submitted", tone: "brand" },
    APPROVED: { label: "Approved", tone: "success" },
    COMPLETED: { label: "Completed", tone: "success" },
    CANCELLED: { label: "Cancelled", tone: "danger" },
    DISPUTED: { label: "Disputed", tone: "danger" },
  },
  payment: {
    PENDING: { label: "Pending", tone: "warning" },
    PAID: { label: "Paid (escrow)", tone: "info" },
    RELEASED: { label: "Released", tone: "success" },
    REFUNDED: { label: "Refunded", tone: "neutral" },
    FAILED: { label: "Failed", tone: "danger" },
  },
  submission: {
    DRAFT: { label: "Draft", tone: "neutral" },
    SUBMITTED: { label: "Submitted", tone: "brand" },
    APPROVED: { label: "Approved", tone: "success" },
    REJECTED: { label: "Rejected", tone: "danger" },
    REVISION_REQUESTED: { label: "Revision requested", tone: "warning" },
  },
  verification: {
    PENDING: { label: "Pending", tone: "warning" },
    APPROVED: { label: "Approved", tone: "success" },
    REJECTED: { label: "Rejected", tone: "danger" },
  },
  verificationState: {
    UNVERIFIED: { label: "Unverified", tone: "neutral" },
    PENDING: { label: "Pending", tone: "warning" },
    VERIFIED: { label: "Verified", tone: "success" },
  },
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getStatusMeta(domain: StatusDomain, status: string): StatusMeta {
  return maps[domain]?.[status] ?? { label: humanize(status), tone: "neutral" };
}
