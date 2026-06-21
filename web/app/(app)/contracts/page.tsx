"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText } from "lucide-react";
import { getContracts } from "@/lib/api/endpoints/contracts";
import { useAuth } from "@/lib/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { formatMoney, formatRelative } from "@/lib/format";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "PENDING_FUNDING", label: "Pending funding" },
  { value: "FUNDED", label: "Funded" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ContractsPage() {
  const { role } = useAuth();
  const query = useQuery({ queryKey: ["contracts"], queryFn: getContracts });
  const [status, setStatus] = useState("all");

  const items = useMemo(
    () => (query.data ?? []).filter((c) => status === "all" || c.status === status),
    [query.data, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Funded engagements, deliveries, and payouts."
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {query.isPending ? (
        <Card className="gap-0 divide-border divide-y p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : items.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<FileText />}
            title="No contracts yet"
            description="Contracts are created automatically when an offer is accepted."
          />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {items.map((c) => {
            const counterparty = role === "BRAND" ? c.creatorName : c.brandName;
            return (
              <Link key={c.id} href={`/contracts/${c.id}`} className="block">
                <div className="hover:bg-muted/40 flex items-center justify-between gap-3 px-5 py-4 transition-colors">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.campaignTitle}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {counterparty} · {c.assetType} · updated {formatRelative(c.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                    <span className="tabular hidden text-sm font-medium sm:inline">
                      {formatMoney(c.agreedPrice, c.currency)}
                    </span>
                    <StatusBadge domain="contract" status={c.status} />
                    <ChevronRight className="text-muted-foreground size-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
