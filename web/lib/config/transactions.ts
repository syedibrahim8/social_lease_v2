import type { StatusTone } from "@/lib/config/status-maps";

/** Transaction ledger entry types → label + tone (mirrors the payments module). */
export const TRANSACTION_TYPES: Record<string, { label: string; tone: StatusTone }> = {
  EARNING: { label: "Earning", tone: "success" },
  PAYOUT: { label: "Payout", tone: "info" },
  COMMISSION: { label: "Commission", tone: "neutral" },
  CHARGE: { label: "Charge", tone: "info" },
  REFUND: { label: "Refund", tone: "warning" },
};

export function transactionType(type: string): { label: string; tone: StatusTone } {
  return TRANSACTION_TYPES[type] ?? { label: type, tone: "neutral" };
}
