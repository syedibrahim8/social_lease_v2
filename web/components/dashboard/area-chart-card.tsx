"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { SeriesPoint } from "@/lib/api/mock/dashboards";

interface AreaChartCardProps {
  title: string;
  data: SeriesPoint[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

/** Themed area chart. Colors come from design tokens so it adapts to dark mode. */
export function AreaChartCard({
  title,
  data,
  valueFormatter,
  height = 240,
}: AreaChartCardProps) {
  const fmt = valueFormatter ?? ((v: number) => String(v));

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cam-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              width={52}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v: number) => fmt(v)}
            />
            <Tooltip
              cursor={{ stroke: "var(--color-border)" }}
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "var(--shadow-md)",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
              formatter={(value) => fmt(Number(value))}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-brand)"
              strokeWidth={2}
              fill="url(#cam-area-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
