import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

export interface BreakdownRow {
  key: string;
  label: ReactNode;
  count: number;
}

/** Label + count + proportion bar — used for status and role breakdowns. */
export function BreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: BreakdownRow[];
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card className="gap-4 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">{r.label}</span>
              <span className="tabular text-muted-foreground text-sm">
                {formatNumber(r.count)}
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
