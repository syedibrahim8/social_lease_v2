"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, TrendingUp, Wallet } from "lucide-react";
import { getCreatorDashboard } from "@/lib/api/endpoints/dashboard";
import { useAuth } from "@/lib/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "./area-chart-card";
import { ActivityList } from "./activity-list";
import { Button } from "@/components/ui/button";
import { formatMoney, formatPercent } from "@/lib/format";

export function CreatorDashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard", "creator"],
    queryFn: getCreatorDashboard,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}.`}
        actions={
          <Button asChild variant="brand" size="sm">
            <Link href="/marketplace">Find campaigns</Link>
          </Button>
        }
      />

      <QueryBoundary query={query} loading={<DashboardSkeleton />}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Available balance"
                value={formatMoney(d.earnings.available)}
                icon={<Wallet className="size-4" />}
                hint={`${d.earnings.payouts} payouts to date`}
              />
              <StatCard
                label="Pending in escrow"
                value={formatMoney(d.earnings.pending)}
                icon={<Clock className="size-4" />}
              />
              <StatCard
                label="Total earned"
                value={formatMoney(d.earnings.totalEarned)}
                icon={<TrendingUp className="size-4" />}
                delta={{ value: "12.4%", direction: "up" }}
              />
              <StatCard
                label="Active contracts"
                value={d.activeContracts}
                icon={<FileText className="size-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <AreaChartCard
                title="Earnings"
                data={d.volume}
                valueFormatter={(v) => formatMoney(v, "USD", { compact: true })}
              />
              <ActivityList items={d.recent} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Application win rate"
                value={formatPercent(d.conversion.rate)}
                mono={false}
                hint={`${d.conversion.accepted} of ${d.conversion.applications} accepted`}
              />
              <StatCard
                label="Delivery approval rate"
                value={formatPercent(d.delivery.approvalRate)}
                mono={false}
                hint={`${d.delivery.approved} of ${d.delivery.total} approved`}
              />
              <StatCard
                label="Pending review"
                value={d.delivery.pendingReview}
                hint="Deliveries awaiting brand approval"
              />
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
