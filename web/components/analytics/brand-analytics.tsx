"use client";

import { useQuery } from "@tanstack/react-query";
import { getBrandAnalytics } from "@/lib/api/endpoints/analytics";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "@/components/dashboard/area-chart-card";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { StatusBadge } from "@/components/data/status-badge";
import { BarChartCard } from "./bar-chart-card";
import { DonutChartCard } from "./donut-chart-card";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export function BrandAnalytics({ range }: { range: string }) {
  const query = useQuery({
    queryKey: ["analytics", "brand"],
    queryFn: getBrandAnalytics,
  });
  const slice = <T,>(arr: T[]): T[] => (range === "3m" ? arr.slice(-3) : arr);
  const money = (v: number) => formatMoney(v, "USD", { compact: true });

  return (
    <QueryBoundary query={query} loading={<DashboardSkeleton />}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total spend" value={formatMoney(d.totals.totalSpend)} />
            <StatCard
              label="Effective CPM"
              value={formatMoney(d.totals.effectiveCpm)}
              hint="Delivery-based proxy"
            />
            <StatCard label="Active campaigns" value={d.totals.activeCampaigns} />
            <StatCard
              label="Completion rate"
              value={formatPercent(d.totals.completionRate)}
              mono={false}
            />
          </div>

          <AreaChartCard title="Spend" data={slice(d.spend)} valueFormatter={money} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DonutChartCard
              title="Spend by platform"
              data={d.byPlatform}
              valueFormatter={money}
            />
            <BarChartCard
              title="Applications received"
              data={slice(d.applications)}
              valueFormatter={formatNumber}
            />
          </div>

          <BreakdownList
            title="Campaigns by status"
            rows={d.campaignsByStatus.map((s) => ({
              key: s.status,
              label: <StatusBadge domain="campaign" status={s.status} />,
              count: s.count,
            }))}
          />
        </div>
      )}
    </QueryBoundary>
  );
}
