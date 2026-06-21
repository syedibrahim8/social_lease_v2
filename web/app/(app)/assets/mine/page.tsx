"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, Package, Plus } from "lucide-react";
import { getMyAssets } from "@/lib/api/endpoints/marketplace";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityPill } from "@/components/marketplace/availability-pill";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { formatCompact, formatMoney } from "@/lib/format";

export default function MyAssetsPage() {
  const query = useQuery({ queryKey: ["my-assets"], queryFn: getMyAssets });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assets"
        description="List your assets and manage availability."
        actions={
          <Button
            variant="brand"
            size="sm"
            onClick={() =>
              toast.message("List new asset", {
                description: "Asset listing creation opens here.",
              })
            }
          >
            <Plus />
            List new asset
          </Button>
        }
      />

      {query.isPending ? (
        <Card className="gap-0 divide-border divide-y p-0">
          {Array.from({ length: 3 }).map((_, i) => (
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
            icon={<Package />}
            title="No assets listed"
            description="List an asset so brands can discover and book you."
          />
        </Card>
      ) : (
        <Card className="gap-0 divide-border divide-y p-0">
          {(query.data ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  {a.verificationStatus === "VERIFIED" ? (
                    <BadgeCheck className="text-brand-text size-3.5 shrink-0" />
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {a.category} · {a.platform} · {formatCompact(a.estimatedReach)} reach
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="tabular hidden text-sm font-medium sm:inline">
                  {formatMoney(a.price)}
                </span>
                <AvailabilityPill status={a.availabilityStatus} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
