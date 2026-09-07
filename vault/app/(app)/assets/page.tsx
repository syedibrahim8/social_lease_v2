"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FilterRail } from "@/components/marketplace/filter-rail";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import {
  getAssets,
  type AssetCategory,
  type AssetFilters,
  type AvailabilityStatus,
} from "@/lib/api/endpoints/assets";
import { PLATFORM_LABEL } from "@/lib/config/labels";
import { PLATFORMS, type Platform } from "@/lib/api/types";
import { formatNumber } from "@/lib/money";
import { qk } from "@/lib/query";

const GROUPS = [
  {
    key: "category",
    label: "Category",
    options: [
      { value: "PROFILE", label: "Profile" },
      { value: "CONTENT", label: "Content" },
      { value: "UGC", label: "UGC" },
    ],
  },
  {
    key: "platform",
    label: "Platform",
    options: PLATFORMS.map((v) => ({ value: v, label: PLATFORM_LABEL[v] })),
  },
  {
    key: "availabilityStatus",
    label: "Availability",
    options: [
      { value: "AVAILABLE", label: "Available" },
      { value: "BUSY", label: "Busy" },
    ],
  },
];

const AVAILABILITY_TONE = {
  AVAILABLE: "positive",
  BUSY: "warning",
  UNAVAILABLE: "muted",
} as const;

function GridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardBody className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AssetsBody() {
  const params = useSearchParams();

  const filters: AssetFilters = {
    ...(params.get("search") ? { search: params.get("search") as string } : {}),
    ...(params.get("category") ? { category: params.get("category") as AssetCategory } : {}),
    ...(params.get("platform") ? { platform: params.get("platform") as Platform } : {}),
    ...(params.get("availabilityStatus")
      ? { availabilityStatus: params.get("availabilityStatus") as AvailabilityStatus }
      : {}),
  };
  const hasFilters = Object.keys(filters).length > 0;

  const query = useQuery({
    queryKey: qk.assets(filters),
    queryFn: () => getAssets(filters),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
      <aside>
        <FilterRail groups={GROUPS} searchPlaceholder="Search creators" />
      </aside>

      <QueryBoundary query={query} skeleton={<GridSkeleton />}>
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? "No listings match those filters" : "No listings yet"}
              description={
                hasFilters
                  ? "Nothing here fits that combination. Try clearing a filter."
                  : "Creators have not listed anything yet. Post a campaign and let them come to you."
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {page.items.map((a) => {
                const tone = AVAILABILITY_TONE[a.availability?.status ?? "UNAVAILABLE"];
                return (
                  <Card key={a.id}>
                    <CardBody className="flex h-full flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="muted">{PLATFORM_LABEL[a.platform] ?? a.platform}</Badge>
                        <Badge tone={tone}>{a.availability?.status ?? "UNAVAILABLE"}</Badge>
                        {a.verificationStatus === "VERIFIED" ? (
                          <Badge tone="positive">Verified</Badge>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-bone line-clamp-2 text-sm font-medium">{a.title}</h3>
                        <p className="text-muted mt-1.5 line-clamp-2 text-xs leading-relaxed">
                          {a.description}
                        </p>
                      </div>
                      <div className="border-line-2 flex items-end justify-between border-t pt-3">
                        {a.price !== undefined ? (
                          <div>
                            <p className="text-faint text-[10px] tracking-[0.14em] uppercase">
                              From
                            </p>
                            <Amount
                              minor={a.price}
                              currency={a.currency ?? "USD"}
                              className="mt-1 block text-[13px]"
                            />
                          </div>
                        ) : (
                          <span />
                        )}
                        {a.estimatedReach ? (
                          <p className="tnum text-muted text-[11px]">
                            {formatNumber(a.estimatedReach)} reach
                          </p>
                        ) : null}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}

export default function AssetsPage() {
  return (
    <>
      <PageHeader
        title="Find creators"
        description="Creator-listed assets, with real reach figures and live availability."
      />
      <Suspense fallback={<GridSkeleton />}>
        <AssetsBody />
      </Suspense>
    </>
  );
}
