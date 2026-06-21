"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Plus, Users } from "lucide-react";
import { getMyCampaigns } from "@/lib/api/endpoints/marketplace";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { formatMoney, formatRelative } from "@/lib/format";

export default function MyCampaignsPage() {
  const query = useQuery({ queryKey: ["my-campaigns"], queryFn: getMyCampaigns });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Campaigns"
        description="Create, publish, and manage your campaigns."
        actions={
          <Button
            variant="brand"
            size="sm"
            onClick={() =>
              toast.message("New campaign", {
                description: "Campaign creation opens here.",
              })
            }
          >
            <Plus />
            New campaign
          </Button>
        }
      />

      {query.isPending ? (
        <Card className="gap-0 divide-border divide-y p-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </Card>
      ) : query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : (query.data ?? []).length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Megaphone />}
            title="No campaigns yet"
            description="Post your first campaign to start receiving applications."
          />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {(query.data ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {c.platform} · {c.assetType} · posted {formatRelative(c.postedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex">
                  <Users className="size-3.5" />
                  {c.applicants}
                </span>
                <span className="tabular hidden text-sm font-medium md:inline">
                  {formatMoney(c.budgetMin)} – {formatMoney(c.budgetMax)}
                </span>
                <StatusBadge domain="campaign" status={c.status} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
