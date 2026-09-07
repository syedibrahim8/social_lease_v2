"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  icon: LucideIcon;
  /** Minor units when `money`, otherwise a plain count. */
  value: number;
  money?: boolean;
  currency?: string;
  hint?: string;
  /** Draws attention when the number means someone has to act. */
  emphasis?: boolean;
}

/**
 * The real numbers, at the top of the dashboard.
 *
 * Every figure comes from an endpoint. Nothing here is invented, and a zero is
 * shown as a zero — a creator who has earned nothing sees $0.00, which is the
 * true and useful answer.
 */
export function StatRow({ stats, loading }: { stats: Stat[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardBody className="space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} tone={s.emphasis ? "money" : "default"}>
            <CardBody className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon
                  className={cn("size-3.5", s.emphasis ? "text-gold-lo" : "text-muted")}
                  aria-hidden="true"
                />
                <p className="text-muted text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {s.label}
                </p>
              </div>
              {s.money ? (
                <Amount
                  minor={s.value}
                  currency={s.currency ?? "USD"}
                  variant="display"
                  className="block text-2xl"
                />
              ) : (
                <p className="tnum text-bone text-2xl">{s.value}</p>
              )}
              {s.hint ? <p className="text-muted text-[11px]">{s.hint}</p> : null}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
