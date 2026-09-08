import { apiFetch, apiGet, apiPost, qs } from "@/lib/api/client";
import {
  refId,
  type ConnectStatus,
  type Paginated,
  type Payment,
  type Transaction,
  type Wallet,
} from "@/lib/api/types";

/* ── Escrow ───────────────────────────────────────────────────────────────── */

/** Brand only, and only while the contract is PENDING_FUNDING. */
export function createCheckout(
  contractId: string,
): Promise<{ checkoutUrl: string; paymentId: string }> {
  return apiPost<{ checkoutUrl: string; paymentId: string }>(
    `/payments/contracts/${contractId}/checkout`,
  );
}

/** Requires the contract to be APPROVED — the backend refuses otherwise. */
export function releasePayment(contractId: string): Promise<Payment> {
  return apiPost<Payment>(`/payments/contracts/${contractId}/release`);
}

/** Pre-release only, and refused once the delivery has been APPROVED. */
export function refundPayment(contractId: string): Promise<Payment> {
  return apiPost<Payment>(`/payments/contracts/${contractId}/refund`);
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

export async function getPayments(
  filters: { status?: Payment["status"]; page?: number; limit?: number } = {},
): Promise<Paginated<Payment>> {
  const { data, meta } = await apiFetch<Payment[]>(`/payments${qs({ ...filters })}`);
  return meta ? { items: data, meta } : { items: data };
}

/**
 * The payment for one contract.
 *
 * `GET /payments` accepts only page/limit/status — there is no contractId
 * filter — so this pages through the caller's own payments and matches locally.
 * Fine at the scale of one user's contracts; if that stops being true, the
 * filter belongs on the backend rather than a bigger loop here.
 */
export async function getPaymentForContract(contractId: string): Promise<Payment | null> {
  const { items } = await getPayments({ limit: 100 });
  // refId, not ===: reads populate contractId into an object, so a direct
  // comparison against the id string never matches and silently returns null.
  return items.find((p) => refId(p.contractId) === contractId) ?? null;
}

export function getWallet(): Promise<Wallet> {
  return apiGet<Wallet>("/payments/wallet");
}

export async function getTransactions(
  filters: { page?: number; limit?: number } = {},
): Promise<Paginated<Transaction>> {
  const { data, meta } = await apiFetch<Transaction[]>(
    `/payments/transactions${qs({ ...filters })}`,
  );
  return meta ? { items: data, meta } : { items: data };
}

/* ── Connect (creator payouts) ────────────────────────────────────────────── */

export function getConnectStatus(): Promise<ConnectStatus> {
  return apiGet<ConnectStatus>("/payments/connect/status");
}

export function startConnectOnboarding(): Promise<{ onboardingUrl: string }> {
  return apiPost<{ onboardingUrl: string }>("/payments/connect/onboard");
}
