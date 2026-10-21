import { apiFetch, apiGet, apiPost, qs } from "@/lib/api/client";
import type { Paginated, Ref, Role, UserRef } from "@/lib/api/types";

/** Mirrors `verification.types.ts`. Each type belongs to exactly one role. */
export const CREATOR_VERIFICATION_TYPES = ["SOCIAL_PROFILE", "PROFILE_OWNERSHIP", "IDENTITY"] as const;
export const BRAND_VERIFICATION_TYPES = ["WEBSITE", "BUSINESS_EMAIL", "COMPANY"] as const;
export const VERIFICATION_TYPES = [...CREATOR_VERIFICATION_TYPES, ...BRAND_VERIFICATION_TYPES] as const;
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

export const VERIFICATION_REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type VerificationRequestStatus = (typeof VERIFICATION_REQUEST_STATUSES)[number];

/** What each type needs as evidence (the backend's superRefine rules). */
export const REQUIRED_EVIDENCE: Record<VerificationType, "profileUrl" | "businessEmail" | "documents"> = {
  SOCIAL_PROFILE: "profileUrl",
  PROFILE_OWNERSHIP: "profileUrl",
  WEBSITE: "profileUrl",
  BUSINESS_EMAIL: "businessEmail",
  IDENTITY: "documents",
  COMPANY: "documents",
};

export interface VerificationEvidence {
  profileUrl?: string;
  handle?: string;
  businessEmail?: string;
  /** URLs; real file upload arrives with the uploads slice. */
  documents?: string[];
  note?: string;
}

export interface VerificationRequest {
  id: string;
  userId: Ref<UserRef>;
  role: Extract<Role, "CREATOR" | "BRAND">;
  verificationType: VerificationType;
  status: VerificationRequestStatus;
  evidence: VerificationEvidence;
  reviewedBy?: Ref<UserRef>;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationAuditEntry {
  id: string;
  requestId: string;
  actorId: Ref<UserRef>;
  action: "SUBMITTED" | "APPROVED" | "REJECTED";
  fromStatus?: VerificationRequestStatus;
  toStatus: VerificationRequestStatus;
  note?: string;
  createdAt: string;
}

/** 409 while a request of the same type is still pending. */
export function submitVerification(input: {
  verificationType: VerificationType;
  evidence: VerificationEvidence;
}): Promise<VerificationRequest> {
  return apiPost<VerificationRequest>("/verifications", input);
}

export async function getMyVerifications(): Promise<Paginated<VerificationRequest>> {
  const { data, meta } = await apiFetch<VerificationRequest[]>(`/verifications/mine${qs({ limit: 100 })}`);
  return meta ? { items: data, meta } : { items: data };
}

export interface VerificationFilters {
  page?: number;
  limit?: number;
  status?: VerificationRequestStatus;
  role?: "CREATOR" | "BRAND";
  verificationType?: VerificationType;
  userId?: string;
}

/** ADMIN only. */
export async function getVerifications(
  filters: VerificationFilters = {},
): Promise<Paginated<VerificationRequest>> {
  const { data, meta } = await apiFetch<VerificationRequest[]>(`/verifications${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

export function approveVerification(id: string, reviewNote?: string): Promise<VerificationRequest> {
  return apiPost<VerificationRequest>(`/verifications/${id}/approve`, reviewNote ? { reviewNote } : {});
}

/** The backend requires a note on rejection, so the creator/brand knows why. */
export function rejectVerification(id: string, reviewNote: string): Promise<VerificationRequest> {
  return apiPost<VerificationRequest>(`/verifications/${id}/reject`, { reviewNote });
}

export function getVerificationAudit(id: string): Promise<VerificationAuditEntry[]> {
  return apiGet<VerificationAuditEntry[]>(`/verifications/${id}/audit`);
}
