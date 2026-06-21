"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { CHART_COLORS, chartTooltip } from "@/lib/chart";
import type { NamedValue } from "@/lib/api/mock/analytics";

interface DonutChartCardProps {
  title: string;
  data: NamedValue[];
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function DonutChartCard({
  title,
  data,
  valueFormatter,
  height = 240,
}: DonutChartCardProps) {
  const fmt = valueFormatter ?? ((v: number) => String(v));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...chartTooltip} formatter={(value, name) => [fmt(Number(value)), name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-semibold">{fmt(total)}</span>
          <span className="text-muted-foreground text-xs">Total</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-muted-foreground truncate">{d.label}</span>
            <span className="tabular ml-auto font-medium">{fmt(d.value)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
