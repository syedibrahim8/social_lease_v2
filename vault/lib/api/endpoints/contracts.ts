import { apiFetch, apiGet, apiPost, qs } from "@/lib/api/client";
import type { Contract, ContractStatus, Paginated } from "@/lib/api/types";

export interface ContractFilters {
  status?: ContractStatus;
  campaignId?: string;
  page?: number;
  limit?: number;
}

/** Your contracts, as either party. The backend scopes with $or on brand/creator. */
export async function getContracts(
  filters: ContractFilters = {},
): Promise<Paginated<Contract>> {
  const { data, meta } = await apiFetch<Contract[]>(`/contracts${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

/** Parties only — non-parties get 404, not 403, so contracts cannot be probed. */
export function getContract(id: string): Promise<Contract> {
  return apiGet<Contract>(`/contracts/${id}`);
}

/**
 * Only permitted while PENDING_FUNDING: once money is in escrow the exit is a
 * refund, not a cancellation. Also cancels the campaign.
 */
export function cancelContract(id: string): Promise<Contract> {
  return apiPost<Contract>(`/contracts/${id}/cancel`);
}
