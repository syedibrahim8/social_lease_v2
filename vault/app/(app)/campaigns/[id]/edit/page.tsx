"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignForm } from "@/components/campaign/campaign-form";
import { getCampaign } from "@/lib/api/endpoints/campaigns";
import { EDITABLE_CAMPAIGN_STATUSES, refId } from "@/lib/api/types";
import { CAMPAIGN_STATUS } from "@/lib/config/labels";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const query = useQuery({ queryKey: qk.campaign(id), queryFn: () => getCampaign(id) });

  return (
    <>
      <BackLink href={`/marketplace/${id}`}>Back to campaign</BackLink>
      <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full" />}>
        {(campaign) => {
          if (refId(campaign.brandId) !== user?.id) {
            return (
              <EmptyState
                icon={Lock}
                title="Only the brand that posted this can edit it"
                description="You can view the campaign, but not change it."
              />
            );
          }
          if (!EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status)) {
            return (
              <EmptyState
                icon={Lock}
                title="This campaign can no longer be edited"
                description={`It is ${CAMPAIGN_STATUS[campaign.status].label.toLowerCase()}. Terms are fixed once a creator is engaged.`}
              />
            );
          }
          return (
            <>
              <PageHeader title="Edit campaign" description={campaign.title} />
              <CampaignForm campaign={campaign} />
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}
