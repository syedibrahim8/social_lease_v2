"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MessagesSquare } from "lucide-react";
import { getNegotiations } from "@/lib/api/endpoints/negotiations";
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
  { value: "PENDING", label: "Pending" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export default function NegotiationsPage() {
  const { role } = useAuth();
  const query = useQuery({ queryKey: ["negotiations"], queryFn: getNegotiations });
  const [status, setStatus] = useState("all");

  const items = useMemo(
    () => (query.data ?? []).filter((n) => status === "all" || n.status === status),
    [query.data, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Negotiation Center"
        description={
          role === "BRAND"
            ? "Offers from creators on your campaigns."
            : "Your applications and live offers."
        }
        actions={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
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
            icon={<MessagesSquare />}
            title="No negotiations yet"
            description={
              role === "BRAND"
                ? "Applications from creators will appear here."
                : "Apply to a campaign to start a negotiation."
            }
          />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {items.map((n) => {
            const latest = n.offers[n.offers.length - 1];
            const pending = latest && latest.status === "PENDING" ? latest : null;
            const myTurn = !!pending && pending.sender !== role;
            const counterparty = role === "BRAND" ? n.creatorName : n.brandName;
            return (
              <Link key={n.id} href={`/negotiations/${n.id}`} className="block">
                <div className="hover:bg-muted/40 flex items-center justify-between gap-3 px-5 py-4 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {n.campaignTitle}
                      </p>
                      {myTurn ? (
                        <span className="bg-brand-muted text-brand-text rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                          Your turn
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {counterparty} · {n.assetType} · {formatRelative(n.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                    <span className="tabular hidden text-sm font-medium sm:inline">
                      {latest ? formatMoney(latest.amount, n.currency) : "—"}
                    </span>
                    <StatusBadge domain="application" status={n.status} />
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
