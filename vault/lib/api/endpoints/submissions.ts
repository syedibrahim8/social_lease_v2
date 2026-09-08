import { apiFetch, apiGet, apiPatch, apiPost, qs } from "@/lib/api/client";
import type {
  Paginated,
  ProofFile,
  ProofLink,
  Submission,
  SubmissionAnalytics,
  SubmissionStatus,
} from "@/lib/api/types";

export interface ProofInput {
  files?: ProofFile[];
  links?: ProofLink[];
  note?: string;
  analytics?: SubmissionAnalytics;
}

/**
 * Create a DRAFT delivery. Server-owned fields (status, revision, parties,
 * asset type) are derived from the contract, and the body is `.strict()`, so
 * sending them is rejected rather than ignored.
 */
export function createSubmission(
  input: ProofInput & { contractId: string },
): Promise<Submission> {
  return apiPost<Submission>("/submissions", input);
}

/** Editable only while DRAFT or REVISION_REQUESTED. */
export function updateSubmission(id: string, input: ProofInput): Promise<Submission> {
  return apiPatch<Submission>(`/submissions/${id}`, input);
}

/** The backend requires at least one file or link here, not at draft time. */
export function submitSubmission(id: string): Promise<Submission> {
  return apiPost<Submission>(`/submissions/${id}/submit`);
}

/** Brand. Sets the contract to APPROVED, which triggers the payout. */
export function approveSubmission(id: string): Promise<Submission> {
  return apiPost<Submission>(`/submissions/${id}/approve`);
}

/** Terminal. A note is required by the backend. */
export function rejectSubmission(id: string, reviewNote: string): Promise<Submission> {
  return apiPost<Submission>(`/submissions/${id}/reject`, { reviewNote });
}

/** Sends it back for another pass. A note is required. */
export function requestRevision(id: string, reviewNote: string): Promise<Submission> {
  return apiPost<Submission>(`/submissions/${id}/request-revision`, { reviewNote });
}

/**
 * Deliveries for one contract. Party-scoped, and the backend hides DRAFTs from
 * the brand — a creator's unfinished work is not the brand's business.
 */
export function getSubmissionsForContract(contractId: string): Promise<Submission[]> {
  return apiGet<Submission[]>(`/submissions/contract/${contractId}`);
}

export async function getMySubmissions(
  filters: { status?: SubmissionStatus; page?: number } = {},
): Promise<Paginated<Submission>> {
  const { data, meta } = await apiFetch<Submission[]>(`/submissions/mine${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}
