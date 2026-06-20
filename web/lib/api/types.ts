/**
 * Shared API DTOs and domain enums. These mirror the backend contract
 * (response envelopes, roles, status state-machines) documented in the root
 * CLAUDE.md. Expanded per feature layer; L0 seeds the cross-cutting pieces.
 */

export type Role = "CREATOR" | "BRAND" | "ADMIN";

/** Pagination meta returned in the success envelope's `meta`. */
export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  errors: ApiFieldError[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isVerified: boolean;
  avatar?: string;
}

/* ---- Domain status state-machines (mirror backend *.types.ts) ---- */

export type CampaignStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "NEGOTIATION"
  | "FUNDED"
  | "COMPLETED"
  | "CANCELLED";

export type ApplicationStatus =
  | "PENDING"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";

export type ContractStatus =
  | "PENDING_FUNDING"
  | "FUNDED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type PaymentStatus = "PENDING" | "PAID" | "RELEASED" | "REFUNDED" | "FAILED";

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED";

/** Verification *request* status (distinct from the profile-level state). */
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Profile-level verification state (creators/brands/assets). */
export type VerificationState = "UNVERIFIED" | "PENDING" | "VERIFIED";
