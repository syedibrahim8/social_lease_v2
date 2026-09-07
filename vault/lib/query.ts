import type { QueryClient } from "@tanstack/react-query";

/**
 * Every query key in the app, in one place.
 *
 * Keys are built by these factories rather than written inline so that a typo
 * cannot silently create a second, never-invalidated cache entry — the failure
 * mode there is a wallet that shows a stale balance after a payout, which is
 * exactly the bug this app cannot afford.
 */
export const qk = {
  me: () => ["me"] as const,

  campaigns: (filters?: Record<string, unknown>) => ["campaigns", filters ?? {}] as const,
  campaign: (id: string) => ["campaign", id] as const,
  myCampaigns: () => ["campaigns", "mine"] as const,

  assets: (filters?: Record<string, unknown>) => ["assets", filters ?? {}] as const,
  asset: (id: string) => ["asset", id] as const,

  applications: (scope: "mine" | "received") => ["applications", scope] as const,
  application: (id: string) => ["application", id] as const,

  contracts: (filters?: Record<string, unknown>) => ["contracts", filters ?? {}] as const,
  contract: (id: string) => ["contract", id] as const,

  submissionsForContract: (contractId: string) => ["submissions", "contract", contractId] as const,

  payment: (contractId: string) => ["payment", contractId] as const,
  wallet: () => ["wallet"] as const,
  transactions: () => ["transactions"] as const,
  connectStatus: () => ["connect-status"] as const,

  notifications: (filters?: Record<string, unknown>) => ["notifications", filters ?? {}] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
  notificationPreferences: () => ["notifications", "preferences"] as const,

  creatorProfile: () => ["profile", "creator"] as const,
  brandProfile: () => ["profile", "brand"] as const,
} as const;

/**
 * What each domain action invalidates.
 *
 * The point of centralising this: "release a payout" touches the payment, the
 * wallet, the ledger, the contract AND the campaign. Written at each call site
 * that fan-out gets forgotten somewhere, and the screen that forgets shows a
 * number that is quietly wrong. Written here, it is one reviewable list.
 */
export type DomainEvent =
  | "fund"
  | "release"
  | "refund"
  | "submit"
  | "approve"
  | "reject"
  | "revision"
  | "apply"
  | "counter"
  | "accept"
  | "withdraw"
  | "connect"
  | "notification"
  | "profile";

/** Keys are readonly tuples (`as const`), so the collection type must be too. */
type QueryKey = readonly unknown[];

const EVENT_KEYS: Record<DomainEvent, readonly QueryKey[]> = {
  // Money moved into escrow: the contract advanced, both ledgers changed.
  fund: [qk.contracts(), qk.wallet(), qk.transactions()],
  // Money left escrow for the creator.
  release: [qk.contracts(), qk.wallet(), qk.transactions()],
  // Money returned to the brand; the contract is cancelled.
  refund: [qk.contracts(), qk.wallet(), qk.transactions()],

  submit: [qk.contracts()],
  // Approval can trigger an automatic payout, so it touches money too.
  approve: [qk.contracts(), qk.wallet(), qk.transactions()],
  reject: [qk.contracts()],
  revision: [qk.contracts()],

  apply: [qk.applications("mine"), qk.campaigns()],
  counter: [qk.applications("mine"), qk.applications("received")],
  // Accepting generates a contract and cascades rejections across applications.
  accept: [qk.applications("mine"), qk.applications("received"), qk.contracts(), qk.campaigns()],
  withdraw: [qk.applications("mine")],

  connect: [qk.connectStatus(), qk.wallet()],
  notification: [qk.notifications(), qk.unreadCount()],
  profile: [qk.creatorProfile(), qk.brandProfile(), qk.me()],
};

/**
 * Invalidate everything a domain action touches.
 *
 * `extra` carries the ids only the caller knows — the specific contract or
 * application — since those keys cannot be enumerated ahead of time.
 */
export function invalidateFor(
  client: QueryClient,
  event: DomainEvent,
  extra: readonly QueryKey[] = [],
): void {
  for (const key of [...EVENT_KEYS[event], ...extra]) {
    void client.invalidateQueries({ queryKey: key });
  }
}
