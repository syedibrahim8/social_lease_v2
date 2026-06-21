"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Inbox, Lock, Megaphone } from "lucide-react";
import { getBrandDashboard } from "@/lib/api/endpoints/dashboard";
import { useAuth } from "@/lib/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "./area-chart-card";
import { ActivityList } from "./activity-list";
import { Button } from "@/components/ui/button";
import { formatCompact, formatMoney, formatPercent } from "@/lib/format";

export function BrandDashboard() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard", "brand"],
    queryFn: getBrandDashboard,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}.`}
        actions={
          <Button asChild variant="brand" size="sm">
            <Link href="/campaigns/mine">New campaign</Link>
          </Button>
        }
      />

      <QueryBoundary query={query} loading={<DashboardSkeleton />}>
        {(d) => (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Net spend"
                value={formatMoney(d.spend.net)}
                icon={<CreditCard className="size-4" />}
                hint={`${formatMoney(d.spend.refunded)} refunded`}
              />
              <StatCard
                label="Held in escrow"
                value={formatMoney(d.spend.inEscrow)}
                icon={<Lock className="size-4" />}
              />
              <StatCard
                label="Active campaigns"
                value={d.campaigns.published}
                icon={<Megaphone className="size-4" />}
                hint={`${d.campaigns.total} total`}
              />
              <StatCard
                label="Applications received"
                value={d.applicationsReceived}
                icon={<Inbox className="size-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <AreaChartCard
                title="Spend"
                data={d.spendSeries}
                valueFormatter={(v) => formatMoney(v, "USD", { compact: true })}
              />
              <ActivityList items={d.recent} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Campaign completion rate"
                value={formatPercent(d.campaigns.completionRate)}
                mono={false}
                hint={`${d.campaigns.completed} of ${d.campaigns.total} completed`}
              />
              <StatCard
                label="Impressions delivered"
                value={formatCompact(d.roi.impressions)}
                mono={false}
                hint="Across approved deliveries"
              />
              <StatCard
                label="Effective CPM"
                value={formatMoney(d.roi.effectiveCpm)}
                hint="Delivery-based proxy, not financial ROI"
              />
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
