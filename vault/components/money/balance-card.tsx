import type { ReactNode } from "react";
import { Amount } from "@/components/money/amount";
import { cn } from "@/lib/utils";

/**
 * The hero balance. Emerald ground, gold bloom, display numerals.
 *
 * A zero balance renders as $0.00 — deliberately, and prominently. This app has
 * no fixtures, so a creator who has earned nothing sees nothing, stated
 * plainly, rather than a placeholder that looks like someone else's money.
 */
export function BalanceCard({
  label,
  minor,
  currency = "USD",
  sub,
  action,
  className,
}: {
  label: string;
  minor: number;
  currency?: string;
  sub?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line relative overflow-hidden rounded-xl border p-5",
        "bg-gradient-to-br from-emerald-deep to-[#0C1614]",
        className,
      )}
    >
      {/* Gold bloom. Decorative only — carries no information, so it is hidden
          from assistive tech and costs nothing if it fails to paint. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 size-56 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, #C9A227 22%, transparent), transparent 68%)",
        }}
      />

      <div className="relative">
        <p className="text-muted text-[10px] font-semibold tracking-[0.17em] uppercase">
          {label}
        </p>
        <Amount minor={minor} currency={currency} variant="display" className="mt-3 block text-4xl" />
        {sub ? <p className="tnum text-muted mt-2 text-[11px]">{sub}</p> : null}
        {action ? <div className="mt-5 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
