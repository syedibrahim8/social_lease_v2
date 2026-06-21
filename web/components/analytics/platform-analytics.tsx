"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlatformAnalytics } from "@/lib/api/endpoints/analytics";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { StatCard } from "@/components/cards/stat-card";
import { AreaChartCard } from "@/components/dashboard/area-chart-card";
import { BreakdownList } from "@/components/dashboard/breakdown-list";
import { StatusBadge } from "@/components/data/status-badge";
import { BarChartCard } from "./bar-chart-card";
import { DonutChartCard } from "./donut-chart-card";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";

export function PlatformAnalytics({ range }: { range: string }) {
  const query = useQuery({
    queryKey: ["analytics", "platform"],
    queryFn: getPlatformAnalytics,
  });
  const slice = <T,>(arr: T[]): T[] => (range === "3m" ? arr.slice(-3) : arr);
  const money = (v: number) => formatMoney(v, "USD", { compact: true });

  return (
    <QueryBoundary query={query} loading={<DashboardSkeleton />}>
      {(d) => (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Gross merchandise value" value={formatMoney(d.totals.gmv)} />
            <StatCard label="Platform revenue" value={formatMoney(d.totals.revenue)} />
            <StatCard label="Escrow held" value={formatMoney(d.totals.escrow)} />
            <StatCard
              label="Take rate"
              value={formatPercent(d.totals.takeRate)}
              mono={false}
            />
          </div>

          <AreaChartCard title="Gross volume" data={slice(d.gmv)} valueFormatter={money} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DonutChartCard
              title="Transactions by type"
              data={d.txByType}
              valueFormatter={formatNumber}
            />
            <BarChartCard
              title="New users"
              data={slice(d.newUsers)}
              valueFormatter={formatNumber}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownList
              title="Users by role"
              rows={d.usersByRole.map((u) => ({
                key: u.label,
                label: u.label,
                count: u.value,
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
          </div>
        </div>
      )}
    </QueryBoundary>
  );
}
