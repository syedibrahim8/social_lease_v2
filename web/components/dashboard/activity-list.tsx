import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Inbox } from "lucide-react";
import { formatMoney, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/lib/api/mock/dashboards";

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-border border-b px-5 py-4">
        <p className="text-sm font-semibold">Recent activity</p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Inbox />} title="No recent activity" />
      ) : (
        <ul className="divide-border divide-y">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatRelative(item.at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {item.amount !== undefined ? (
                  <span className="tabular text-sm font-medium">
                    {formatMoney(item.amount)}
                  </span>
                ) : null}
                <StatusBadge domain={item.domain} status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
