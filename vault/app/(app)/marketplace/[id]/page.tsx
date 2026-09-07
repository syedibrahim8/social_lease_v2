"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import { ApplyDialog } from "@/components/negotiation/apply-dialog";
import { getCampaign } from "@/lib/api/endpoints/campaigns";
import { ASSET_TYPE_LABEL, CAMPAIGN_STATUS, PLATFORM_LABEL } from "@/lib/config/labels";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

export default function CampaignDetailPage({
  params,
}: {
  // Next.js 16: params is a Promise; client components read it with use().
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const [applyOpen, setApplyOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.campaign(id),
    queryFn: () => getCampaign(id),
  });

  return (
    <>
      <BackLink href="/marketplace">All campaigns</BackLink>

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        {(campaign) => {
          const status = CAMPAIGN_STATUS[campaign.status];
          return (
            <>
              <PageHeader
                title={campaign.title}
                action={
                  role === "CREATOR" && campaign.status === "PUBLISHED" ? (
                    <Button variant="gold" size="sm" onClick={() => setApplyOpen(true)}>
                      Apply
                    </Button>
                  ) : undefined
                }
              />

              <div className="mb-6 flex flex-wrap items-center gap-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                <Badge tone="muted">{ASSET_TYPE_LABEL[campaign.assetType]}</Badge>
                <Badge tone="muted">{PLATFORM_LABEL[campaign.platform]}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                <div className="space-y-4">
                  <Card>
                    <CardBody>
                      <h2 className="text-bone mb-2 text-[13px] font-medium">The brief</h2>
                      <p className="text-bone-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                        {campaign.description}
                      </p>
                    </CardBody>
                  </Card>

                  {campaign.requirements.length > 0 ? (
                    <Card>
                      <CardBody>
                        <h2 className="text-bone mb-3 text-[13px] font-medium">Requirements</h2>
                        <ul className="space-y-2">
                          {campaign.requirements.map((r, i) => (
                            <li key={i} className="text-bone-2 flex gap-2.5 text-[13px]">
                              <Check
                                className="text-positive mt-0.5 size-3.5 shrink-0"
                                aria-hidden="true"
                              />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </CardBody>
                    </Card>
                  ) : null}
                </div>

                <Card tone="money" className="h-fit">
                  <CardBody className="space-y-4">
                    <div>
                      <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
                        Budget range
                      </p>
                      <p className="mt-2 text-[15px]">
                        <Amount minor={campaign.budgetMin} currency={campaign.currency} />
                        <span className="text-muted mx-1.5">to</span>
                        <Amount minor={campaign.budgetMax} currency={campaign.currency} />
                      </p>
                      <p className="text-muted mt-2 text-[11px] leading-relaxed">
                        The final figure is agreed in negotiation, then held in escrow before
                        work begins.
                      </p>
                    </div>

                    <div className="border-line border-t pt-4">
                      <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
                        Asset stays live
                      </p>
                      <p className="tnum text-bone mt-2 flex items-center gap-1.5 text-[13px]">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {campaign.duration} days
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {role === "CREATOR" ? (
                <ApplyDialog
                  campaign={campaign}
                  open={applyOpen}
                  onOpenChange={setApplyOpen}
                />
              ) : null}
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}
