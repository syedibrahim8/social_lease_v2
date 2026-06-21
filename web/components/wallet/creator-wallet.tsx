"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, TrendingUp, Wallet } from "lucide-react";
import {
  getCreatorTransactions,
  getCreatorWallet,
} from "@/lib/api/endpoints/wallet";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { StatCard } from "@/components/cards/stat-card";
import { ConnectStatusCard } from "./connect-status-card";
import { TransactionsTable } from "./transactions-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="gap-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
        </Card>
      ))}
    </div>
  );
}

export function CreatorWalletView() {
  const wallet = useQuery({ queryKey: ["wallet", "creator"], queryFn: getCreatorWallet });
  const txns = useQuery({
    queryKey: ["transactions", "creator"],
    queryFn: getCreatorTransactions,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        description="Balances, payouts, and your transaction ledger."
        actions={
          <Button
            variant="brand"
            size="sm"
            onClick={() =>
              toast.success("Payout requested", {
                description: "Funds are on their way to your bank account.",
              })
            }
          >
            Withdraw
          </Button>
        }
      />

      <QueryBoundary query={wallet} loading={<StatsSkeleton />}>
        {(w) => (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Available"
                value={formatMoney(w.available, w.currency)}
                icon={<Wallet className="size-4" />}
                hint={`${w.payoutsCount} payouts to date`}
              />
              <StatCard
                label="Pending in escrow"
                value={formatMoney(w.pending, w.currency)}
                icon={<Clock className="size-4" />}
              />
              <StatCard
                label="Total earned"
                value={formatMoney(w.totalEarned, w.currency)}
                icon={<TrendingUp className="size-4" />}
              />
            </div>
            <ConnectStatusCard wallet={w} />
          </div>
        )}
      </QueryBoundary>

      <QueryBoundary query={txns} loading={<Skeleton className="h-64 w-full" />}>
        {(list) => <TransactionsTable transactions={list} />}
      </QueryBoundary>
    </div>
  );
}
