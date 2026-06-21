"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Coins, Lock, Receipt } from "lucide-react";
import { getAdminDashboard } from "@/lib/api/endpoints/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "./area-chart-card";
import { ActivityList } from "./activity-list";
import { BreakdownList } from "./breakdown-list";
import { StatusBadge } from "@/components/data/status-badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatNumber } from "@/lib/format";

export function AdminDashboard() {
  const query = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: getAdminDashboard,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform overview"
        description="Marketplace health at a glance."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/notifications">Send broadcast</Link>
          </Button>
        }
      />

      <QueryBoundary query={query} loading={<DashboardSkeleton />}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Gross merchandise value"
                value={formatMoney(d.gmv)}
                icon={<Banknote className="size-4" />}
                delta={{ value: "18.2%", direction: "up" }}
              />
              <StatCard
                label="Platform revenue"
                value={formatMoney(d.revenue)}
                icon={<Coins className="size-4" />}
                hint="Commission on released payouts"
              />
              <StatCard
                label="Escrow held"
                value={formatMoney(d.escrowHeld)}
                icon={<Lock className="size-4" />}
              />
              <StatCard
                label="Transactions"
                value={formatNumber(d.totalTransactions)}
                icon={<Receipt className="size-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <AreaChartCard
                title="Gross volume"
                data={d.gmvSeries}
                valueFormatter={(v) => formatMoney(v, "USD", { compact: true })}
              />
              <ActivityList items={d.recent} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <BreakdownList
                title="Campaigns by status"
                rows={d.campaignsByStatus.map((s) => ({
                  key: s.status,
                  label: <StatusBadge domain="campaign" status={s.status} />,
                  count: s.count,
                }))}
              />
              <BreakdownList
                title="Contracts by status"
                rows={d.contractsByStatus.map((s) => ({
                  key: s.status,
                  label: <StatusBadge domain="contract" status={s.status} />,
                  count: s.count,
                }))}
              />
              <BreakdownList
                title="Users by role"
                rows={[
                  { key: "creators", label: "Creators", count: d.users.creators },
                  { key: "brands", label: "Brands", count: d.users.brands },
                  { key: "admins", label: "Admins", count: d.users.admins },
                ]}
              />
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
