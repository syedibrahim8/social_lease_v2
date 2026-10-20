"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ChoicePills } from "@/components/ui/choice-pills";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCampaigns } from "@/lib/api/endpoints/campaigns";
import type { CampaignStatus } from "@/lib/api/types";
import { CAMPAIGN_STATUS } from "@/lib/config/labels";
import { useMyProfile } from "@/lib/auth/use-profile";
import { qk } from "@/lib/query";

type Filter = "ALL" | CampaignStatus;

/** The states a brand actually filters by; the rest are rare and visible under All. */
const FILTERS: Filter[] = ["ALL", "DRAFT", "PUBLISHED", "NEGOTIATION", "FUNDED", "COMPLETED", "CANCELLED"];

export default function MyCampaignsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const { missing } = useMyProfile();
  const status = filter === "ALL" ? undefined : filter;

  const query = useQuery({
    queryKey: [...qk.myCampaigns(), status ?? "all"],
    queryFn: () => getMyCampaigns(status ? { status } : {}),
  });

  const newButton = (
    <Button asChild variant="gold" size="sm">
      <Link href={missing ? "/onboarding" : "/campaigns/new"}>
        <Plus aria-hidden="true" />
        New campaign
      </Link>
    </Button>
  );

  return (
    <>
      <PageHeader
        title="My campaigns"
        description="Everything you have posted, at every stage from draft to paid out."
        action={newButton}
      />

      <ChoicePills
        className="mb-5"
        label="Filter by status"
        options={FILTERS.map((f) => ({
          value: f,
          label: f === "ALL" ? "All" : CAMPAIGN_STATUS[f].label,
        }))}
        value={filter}
        onChange={setFilter}
      />

      <QueryBoundary
        query={query}
        skeleton={
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Card key={i}>
                <CardBody className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardBody>
              </Card>
            ))}
          </div>
        }
      >
        {(page) =>
          page.items.length === 0 ? (
            filter === "ALL" ? (
              <EmptyState
                icon={Megaphone}
                title="You haven't posted a campaign yet"
                description="A campaign is the brief creators apply to. Post one, agree a price, then fund escrow before the work starts."
                action={newButton}
              />
            ) : (
              <EmptyState
                icon={Megaphone}
                title={`No ${CAMPAIGN_STATUS[filter].label.toLowerCase()} campaigns`}
                description="Try another status, or All."
              />
            )
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {page.items.map((c) => (
                <CampaignCard key={c.id} campaign={c} href={`/marketplace/${c.id}`} showStatus />
              ))}
            </div>
          )
        }
      </QueryBoundary>
    </>
  );
}
