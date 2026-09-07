import { apiFetch, apiGet, apiPost, qs } from "@/lib/api/client";
import type { Application, ApplicationStatus, Paginated } from "@/lib/api/types";

export interface ApplyInput {
  campaignId: string;
  proposal: string;
  /** Minor units. */
  proposedPrice: number;
  estimatedReach: number;
}

/**
 * Apply to a campaign.
 *
 * Can fail with 403 when the creator has no payout-ready Stripe account: the
 * backend refuses to engage someone it could not later pay, so escrow never
 * gets stuck. Callers should catch that specific case and route to onboarding
 * rather than showing it as a generic failure.
 */
export function apply(input: ApplyInput): Promise<Application> {
  return apiPost<Application>("/applications", input);
}

async function list(
  path: string,
  filters: { status?: ApplicationStatus; campaignId?: string; page?: number; limit?: number },
): Promise<Paginated<Application>> {
  const { data, meta } = await apiFetch<Application[]>(`${path}${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

export function getMyApplications(
  filters: { status?: ApplicationStatus; page?: number } = {},
): Promise<Paginated<Application>> {
  return list("/applications/mine", filters);
}

export function getReceivedApplications(
  filters: { status?: ApplicationStatus; page?: number } = {},
): Promise<Paginated<Application>> {
  return list("/applications/received", filters);
}

/** Participants only — the backend returns 404 to anyone else, not 403. */
export function getApplication(id: string): Promise<Application> {
  return apiGet<Application>(`/applications/${id}`);
}

export function counterOffer(
  id: string,
  input: { amount: number; message?: string },
): Promise<Application> {
  return apiPost<Application>(`/applications/${id}/counter`, input);
}

/** Accepting generates the contract and auto-rejects competing applications. */
export function acceptOffer(id: string): Promise<Application> {
  return apiPost<Application>(`/applications/${id}/accept`);
}

export function rejectOffer(id: string, message?: string): Promise<Application> {
  return apiPost<Application>(`/applications/${id}/reject`, message ? { message } : {});
}

export function withdrawApplication(id: string): Promise<Application> {
  return apiPost<Application>(`/applications/${id}/withdraw`);
}
