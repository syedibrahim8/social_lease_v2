"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import {
  getMyApplications,
  getReceivedApplications,
} from "@/lib/api/endpoints/applications";
import { APPLICATION_STATUS, ASSET_TYPE_LABEL } from "@/lib/config/labels";
import { refOrNull, type Application } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

/** The offer currently on the table, if any. */
function pendingOffer(app: Application) {
  return app.offers.find((o) => o.status === "PENDING");
}

export default function NegotiationsPage() {
  const { role, user } = useAuth();
  const isCreator = role === "CREATOR";

  const query = useQuery({
    queryKey: qk.applications(isCreator ? "mine" : "received"),
    queryFn: () => (isCreator ? getMyApplications() : getReceivedApplications()),
    enabled: Boolean(role),
  });

  return (
    <>
      <PageHeader
        title="Negotiations"
        description={
          isCreator
            ? "Campaigns you have applied to, and where each offer stands."
            : "Creators who applied to your campaigns, and where each offer stands."
        }
      />

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i}>
                <CardBody className="space-y-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </CardBody>
              </Card>
            ))}
          </div>
        }
      >
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title={isCreator ? "You haven't applied yet" : "No applications yet"}
              description={
                isCreator
                  ? "Find a campaign that fits and send an opening offer. Negotiation happens here."
                  : "When creators apply to your campaigns, their offers land here."
              }
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href={isCreator ? "/marketplace" : "/campaigns/mine"}>
                    {isCreator ? "Find campaigns" : "View my campaigns"}
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {page.items.map((app) => {
                const status = APPLICATION_STATUS[app.status];
                const campaign = refOrNull(app.campaignId);
                const other = refOrNull(isCreator ? app.brandId : app.creatorId);
                const offer = pendingOffer(app);
                const yourTurn = offer?.receiver === user?.id;

                return (
                  <Link key={app.id} href={`/negotiations/${app.id}`} className="group block">
                    <Card className="hover:border-line transition-colors">
                      <CardBody className="flex flex-wrap items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={status.tone}>{status.label}</Badge>
                            {yourTurn ? <Badge tone="gold">Your turn</Badge> : null}
                            <Badge tone="muted">{ASSET_TYPE_LABEL[app.assetType]}</Badge>
                          </div>
                          <p className="text-bone group-hover:text-gold-lo truncate text-sm font-medium transition-colors">
                            {campaign?.title ?? "Campaign"}
                          </p>
                          <p className="text-muted mt-0.5 truncate text-xs">
                            {isCreator ? "Brand" : "Creator"}: {other?.name ?? "—"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-muted text-[10px] tracking-[0.14em] uppercase">
                            {offer ? "On the table" : app.agreedPrice ? "Agreed" : "Proposed"}
                          </p>
                          <Amount
                            minor={offer?.amount ?? app.agreedPrice ?? app.proposedPrice}
                            currency={app.currency}
                            className="mt-1 block text-[13px]"
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )
        }
      </QueryBoundary>
    </>
  );
}
