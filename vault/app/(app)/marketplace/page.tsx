"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { FilterRail } from "@/components/marketplace/filter-rail";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaigns, type CampaignFilters } from "@/lib/api/endpoints/campaigns";
import { ASSET_TYPE_LABEL, PLATFORM_LABEL } from "@/lib/config/labels";
import { ASSET_TYPES, PLATFORMS, type AssetType, type Platform } from "@/lib/api/types";
import { qk } from "@/lib/query";

const GROUPS = [
  {
    key: "assetType",
    label: "Asset",
    options: ASSET_TYPES.map((v) => ({ value: v, label: ASSET_TYPE_LABEL[v] })),
  },
  {
    key: "platform",
    label: "Platform",
    options: PLATFORMS.map((v) => ({ value: v, label: PLATFORM_LABEL[v] })),
  },
];

function CampaignGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardBody className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function MarketplaceBody() {
  const params = useSearchParams();

  const filters: CampaignFilters = {
    ...(params.get("search") ? { search: params.get("search") as string } : {}),
    ...(params.get("assetType") ? { assetType: params.get("assetType") as AssetType } : {}),
    ...(params.get("platform") ? { platform: params.get("platform") as Platform } : {}),
  };

  const hasFilters = Object.keys(filters).length > 0;

  const query = useQuery({
    queryKey: qk.campaigns(filters),
    queryFn: () => getCampaigns(filters),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
      <aside>
        <FilterRail groups={GROUPS} searchPlaceholder="Search campaigns" />
      </aside>

      <QueryBoundary query={query} skeleton={<CampaignGridSkeleton />}>
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={hasFilters ? "No campaigns match those filters" : "No open campaigns yet"}
              description={
                hasFilters
                  ? "Nothing is open that fits. Try clearing a filter to widen the search."
                  : "Brands have not published anything open to applications right now. Check back shortly."
              }
            />
          ) : (
            <div>
              <p className="text-muted mb-3 text-xs">
                <span className="tnum text-bone-2">{page.meta?.totalItems ?? page.items.length}</span>{" "}
                open {(page.meta?.totalItems ?? page.items.length) === 1 ? "campaign" : "campaigns"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {page.items.map((c) => (
                  <CampaignCard key={c.id} campaign={c} href={`/marketplace/${c.id}`} />
                ))}
              </div>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <>
      <PageHeader
        title="Find campaigns"
        description="Briefs that are open to applications. Every one is funded through escrow before work starts."
      />
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<CampaignGridSkeleton />}>
        <MarketplaceBody />
      </Suspense>
    </>
  );
}
