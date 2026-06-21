"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, Lock, Undo2 } from "lucide-react";
import {
  getBrandTransactions,
  getBrandWallet,
} from "@/lib/api/endpoints/wallet";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { StatCard } from "@/components/cards/stat-card";
import { TransactionsTable } from "./transactions-table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
        </Card>
      ))}
    </div>
  );
}

export function BrandWalletView() {
  const wallet = useQuery({ queryKey: ["wallet", "brand"], queryFn: getBrandWallet });
  const txns = useQuery({
    queryKey: ["transactions", "brand"],
    queryFn: getBrandTransactions,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Campaign spend, escrow, and your payment ledger."
      />

      <QueryBoundary query={wallet} loading={<StatsSkeleton />}>
        {(w) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total funded"
              value={formatMoney(w.totalFunded, w.currency)}
              icon={<CreditCard className="size-4" />}
            />
            <StatCard
              label="Held in escrow"
              value={formatMoney(w.inEscrow, w.currency)}
              icon={<Lock className="size-4" />}
              hint="Releases on approval"
            />
            <StatCard
              label="Refunded"
              value={formatMoney(w.refunded, w.currency)}
              icon={<Undo2 className="size-4" />}
            />
            <StatCard
              label="Net spend"
              value={formatMoney(w.netSpend, w.currency)}
              icon={<Banknote className="size-4" />}
            />
          </div>
        )}
      </QueryBoundary>

      <QueryBoundary query={txns} loading={<Skeleton className="h-64 w-full" />}>
        {(list) => <TransactionsTable transactions={list} />}
      </QueryBoundary>
    </div>
  );
}
