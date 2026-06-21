import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ToneBadge } from "@/components/data/tone-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { transactionType } from "@/lib/config/transactions";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/api/mock/wallet";

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="border-border border-b px-5 py-4">
        <p className="text-sm font-semibold">Transactions</p>
      </div>
      {transactions.length === 0 ? (
        <EmptyState icon={<Receipt />} title="No transactions yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const meta = transactionType(t.type);
              return (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground tabular whitespace-nowrap">
                    {formatDate(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ToneBadge tone={meta.tone}>{meta.label}</ToneBadge>
                  </TableCell>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell
                    className={cn(
                      "tabular text-right font-medium whitespace-nowrap",
                      t.direction === "in" && "text-success-text",
                    )}
                  >
                    {t.direction === "in" ? "+" : "−"}
                    {formatMoney(t.amount, t.currency)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge domain="payment" status={t.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
