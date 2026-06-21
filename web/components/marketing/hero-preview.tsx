import { StatCard } from "@/components/cards/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { formatMoney, formatCompact } from "@/lib/format";

const bars = [38, 52, 44, 68, 60, 82, 74, 95];

const rows = [
  { name: "Summer Launch", domain: "campaign" as const, status: "PUBLISHED", amount: 500000 },
  { name: "Holiday UGC", domain: "campaign" as const, status: "NEGOTIATION", amount: 320000 },
  { name: "Q4 Ambassador", domain: "contract" as const, status: "APPROVED", amount: 875000 },
];

/** A framed mock dashboard that sells the product, built from the real design system. */
export function HeroPreview() {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-lg">
      <div className="border-border flex items-center gap-1.5 border-b px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#EF4444]/50" />
        <span className="size-2.5 rounded-full bg-[#F59E0B]/50" />
        <span className="size-2.5 rounded-full bg-[#22C55E]/50" />
        <span className="text-muted-foreground ml-3 hidden text-xs sm:block">
          app.creatormarket.com/dashboard
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Gross volume"
            value={formatMoney(1284500, "USD", { compact: true })}
            delta={{ value: "12.4%", direction: "up" }}
          />
          <StatCard
            label="Active campaigns"
            value="14"
            delta={{ value: "3", direction: "up" }}
          />
          <StatCard
            label="Creators reached"
            value={formatCompact(48200)}
            mono={false}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Volume this month
            </p>
            <div className="flex h-28 items-end gap-2">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="bg-brand/80 flex-1 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="border-border rounded-xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Recent activity
            </p>
            <ul className="space-y-3">
              {rows.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  <StatusBadge domain={r.domain} status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
