import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Monospaced tabular figures (money / counts). Default true. */
  mono?: boolean;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" | "neutral" };
  icon?: ReactNode;
  className?: string;
}

/**
 * Mercury/Stripe-style metric card: small uppercase label, a large tabular
 * value, an optional directional delta. The reusable unit of every dashboard.
 */
export function StatCard({
  label,
  value,
  mono = true,
  hint,
  delta,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight",
            mono && "tabular",
          )}
        >
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta.direction === "up" && "text-success-text",
              delta.direction === "down" && "text-danger-text",
              delta.direction === "neutral" && "text-muted-foreground",
            )}
          >
            {delta.direction === "up" && <ArrowUpRight className="size-3.5" />}
            {delta.direction === "down" && <ArrowDownRight className="size-3.5" />}
            {delta.value}
          </span>
        ) : null}
      </div>

      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </Card>
  );
}
