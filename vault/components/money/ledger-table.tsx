import { format } from "date-fns";
import { Amount } from "@/components/money/amount";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { Transaction, TransactionType } from "@/lib/api/types";

/**
 * The immutable ledger. Every row is a real movement the backend recorded, and
 * the sign is the backend's — never recomputed here.
 *
 * Creator rows carry `creatorAmount` (net of commission); brand rows carry the
 * gross `amount`. The two sides of the same payment therefore differ by the
 * platform's cut, which is correct accounting rather than a bug.
 */
const TONE: Record<TransactionType, "positive" | "gold" | "negative" | "muted"> = {
  PAYOUT: "positive",
  EARNING: "gold",
  SPEND: "negative",
  REFUND: "muted",
};

export function LedgerTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Table>
      <THead>
        <TR className="border-t-0">
          <TH>Description</TH>
          <TH>Type</TH>
          <TH className="text-right">Amount</TH>
          <TH className="text-right">Date</TH>
        </TR>
      </THead>
      <TBody>
        {transactions.map((t) => (
          <TR key={t.id}>
            <TD className="text-bone max-w-[42ch] truncate">{t.description}</TD>
            <TD>
              {/* Type is a word, not just a colour — the badge tone is redundant
                  reinforcement, never the only signal. */}
              <Badge tone={TONE[t.type]}>{t.type}</Badge>
            </TD>
            <TD className="text-right">
              <Amount minor={t.amount} currency={t.currency} signed />
            </TD>
            <TD className="tnum text-muted text-right whitespace-nowrap">
              {format(new Date(t.createdAt), "MMM dd")}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
