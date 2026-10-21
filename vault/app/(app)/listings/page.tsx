"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Eye, LayoutGrid, Plus, Radio } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatRow } from "@/components/dashboard/stat-row";
import { AssetCard } from "@/components/assets/asset-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssetAnalytics, getMyAssets } from "@/lib/api/endpoints/assets";
import { useAuth } from "@/lib/auth/auth-provider";
import { useMyProfile } from "@/lib/auth/use-profile";
import { qk } from "@/lib/query";

export default function MyListingsPage() {
  const { role } = useAuth();
  const { missing } = useMyProfile();
  const isCreator = role === "CREATOR";

  const listings = useQuery({ queryKey: qk.myAssets(), queryFn: () => getMyAssets(), enabled: isCreator });
  const analytics = useQuery({ queryKey: qk.assetAnalytics(), queryFn: getAssetAnalytics, enabled: isCreator });

  if (!isCreator) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Listings belong to creators"
        description="Brands browse them from Find creators."
      />
    );
  }

  const newButton = (
    <Button asChild variant="gold" size="sm">
      <Link href={missing ? "/onboarding" : "/listings/new"}>
        <Plus aria-hidden="true" />
        New listing
      </Link>
    </Button>
  );

  const a = analytics.data;
  return (
    <>
      <PageHeader
        title="My listings"
        description="What you offer brands: profile space, content and UGC, with your availability."
        action={newButton}
      />

      <div className="mb-6">
        <StatRow
          loading={analytics.isPending}
          stats={[
            { label: "Listings", icon: LayoutGrid, value: a?.totalAssets ?? 0 },
            { label: "Total estimated reach", icon: Radio, value: a?.totalEstimatedReach ?? 0 },
            { label: "Average views", icon: Eye, value: Math.round(a?.averageViews ?? 0) },
            {
              label: "Available now",
              icon: CalendarCheck,
              value: a?.byAvailability?.AVAILABLE ?? 0,
            },
          ]}
        />
      </div>

      <QueryBoundary
        query={listings}
        skeleton={
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        }
      >
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="You haven't listed anything yet"
              description="List a pinned post, a bio link or a piece of content. Brands find you here, and your calendar shows when you're free."
              action={newButton}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {page.items.map((asset) => (
                <AssetCard key={asset.id} asset={asset} href={`/listings/${asset.id}`} />
              ))}
            </div>
          )
        }
      </QueryBoundary>
    </>
  );
}
