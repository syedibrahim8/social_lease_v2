"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCampaigns } from "@/lib/api/endpoints/campaigns";
import { qk } from "@/lib/query";

export default function MyCampaignsPage() {
  const query = useQuery({
    queryKey: qk.myCampaigns(),
    queryFn: () => getMyCampaigns(),
  });

  return (
    <>
      <PageHeader
        title="My campaigns"
        description="Everything you have posted, at every stage from draft to paid out."
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
            <EmptyState
              icon={Megaphone}
              title="You haven't posted a campaign yet"
              description="A campaign is the brief creators apply to. Post one, agree a price, then fund escrow before the work starts."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {page.items.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  href={`/marketplace/${c.id}`}
                  showStatus
                />
              ))}
            </div>
          )
        }
      </QueryBoundary>
    </>
  );
}
