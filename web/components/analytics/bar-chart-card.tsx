"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { chartTooltip } from "@/lib/chart";
import type { SeriesPoint } from "@/lib/api/mock/dashboards";

interface BarChartCardProps {
  title: string;
  data: SeriesPoint[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function BarChartCard({
  title,
  data,
  valueFormatter,
  height = 240,
}: BarChartCardProps) {
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v: number) => fmt(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
              {...chartTooltip}
              formatter={(value) => fmt(Number(value))}
            />
            <Bar
              dataKey="value"
              fill="var(--color-brand)"
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
