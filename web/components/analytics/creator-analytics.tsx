"use client";

import { useQuery } from "@tanstack/react-query";
import { getCreatorAnalytics } from "@/lib/api/endpoints/analytics";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "@/components/dashboard/area-chart-card";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { BarChartCard } from "./bar-chart-card";
import { DonutChartCard } from "./donut-chart-card";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export function CreatorAnalytics({ range }: { range: string }) {
  const query = useQuery({
    queryKey: ["analytics", "creator"],
    queryFn: getCreatorAnalytics,
  });
  const slice = <T,>(arr: T[]): T[] => (range === "3m" ? arr.slice(-3) : arr);
  const money = (v: number) => formatMoney(v, "USD", { compact: true });

  return (
    <QueryBoundary query={query} loading={<DashboardSkeleton />}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total earned" value={formatMoney(d.totals.totalEarned)} />
            <StatCard label="Avg deal size" value={formatMoney(d.totals.avgDealSize)} />
            <StatCard label="Completed deals" value={d.totals.completedDeals} />
            <StatCard
              label="Repeat-brand rate"
              value={formatPercent(d.totals.repeatRate)}
              mono={false}
            />
          </div>

          <AreaChartCard title="Earnings" data={slice(d.earnings)} valueFormatter={money} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DonutChartCard
              title="Earnings by platform"
              data={d.byPlatform}
              valueFormatter={money}
            />
            <BarChartCard
              title="Applications sent"
              data={slice(d.applications)}
              valueFormatter={formatNumber}
            />
          </div>

          <BreakdownList
            title="Application funnel"
            rows={d.funnel.map((f) => ({ key: f.label, label: f.label, count: f.value }))}
          />
        </div>
      )}
    </QueryBoundary>
  );
}
