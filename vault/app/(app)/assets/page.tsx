"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FilterRail } from "@/components/marketplace/filter-rail";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCard } from "@/components/assets/asset-card";
import { RecommendedCreators } from "@/components/ai/recommended-creators";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAssets,
  type AssetCategory,
  type AssetFilters,
  type AvailabilityStatus,
} from "@/lib/api/endpoints/assets";
import { ASSET_CATEGORY_LABEL, PLATFORM_LABEL } from "@/lib/config/labels";
import { ASSET_CATEGORIES, PLATFORMS, type Platform } from "@/lib/api/types";
import { qk } from "@/lib/query";

const GROUPS = [
  {
    key: "category",
    label: "Category",
    options: ASSET_CATEGORIES.map((v) => ({ value: v, label: ASSET_CATEGORY_LABEL[v] })),
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
    ...(params.get("creatorId") ? { creatorId: params.get("creatorId") as string } : {}),
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
              {page.items.map((a) => (
                <AssetCard key={a.id} asset={a} href={`/assets/${a.id}`} />
              ))}
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}

function FindCreators() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = params.get("view") === "recommended" ? "recommended" : "listings";
  const setView = (next: string) => {
    const q = new URLSearchParams(params.toString());
    if (next === "listings") q.delete("view");
    else q.set("view", next);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={view} onValueChange={setView}>
      <TabsList>
        <TabsTrigger value="listings">Listings</TabsTrigger>
        <TabsTrigger value="recommended">Recommended</TabsTrigger>
      </TabsList>
      <TabsContent value="listings">
        <AssetsBody />
      </TabsContent>
      <TabsContent value="recommended">
        <RecommendedCreators />
      </TabsContent>
    </Tabs>
  );
}

export default function AssetsPage() {
  return (
    <>
      <PageHeader
        title="Find creators"
        description="Creator-listed assets with real reach figures and live availability, or a ranked shortlist for your brief."
      />
      <Suspense fallback={<GridSkeleton />}>
        <FindCreators />
      </Suspense>
    </>
  );
}
