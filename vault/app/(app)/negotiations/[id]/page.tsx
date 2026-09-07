"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { OfferThread } from "@/components/negotiation/offer-thread";
import { NegotiationActions } from "@/components/negotiation/negotiation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import { getApplication } from "@/lib/api/endpoints/applications";
import { APPLICATION_STATUS, ASSET_TYPE_LABEL } from "@/lib/config/labels";
import { refOrNull } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatNumber } from "@/lib/money";
import { qk } from "@/lib/query";

export default function NegotiationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, role } = useAuth();

  const query = useQuery({
    queryKey: qk.application(id),
    queryFn: () => getApplication(id),
  });

  return (
    <>
      <Link
        href="/negotiations"
        className="text-muted hover:text-bone mb-5 inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All negotiations
      </Link>

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        }
      >
        {(app) => {
          const status = APPLICATION_STATUS[app.status];
          const campaign = refOrNull(app.campaignId);
          const isCreator = role === "CREATOR";
          const other = refOrNull(isCreator ? app.brandId : app.creatorId);
          const pending = app.offers.find((o) => o.status === "PENDING");

          return (
            <>
              <PageHeader
                title={campaign?.title ?? "Negotiation"}
                description={`${isCreator ? "Brand" : "Creator"}: ${other?.name ?? "—"}`}
                action={
                  app.status === "ACCEPTED" ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/contracts">
                        <FileText />
                        View contract
                      </Link>
                    </Button>
                  ) : undefined
                }
              />

              <div className="mb-6 flex flex-wrap items-center gap-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                <Badge tone="muted">{ASSET_TYPE_LABEL[app.assetType]}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
                <div className="space-y-4">
                  <Card>
                    <CardBody>
                      <h2 className="text-bone mb-3 text-[13px] font-medium">Offers</h2>
                      <OfferThread
                        offers={app.offers}
                        currency={app.currency}
                        currentUserId={user?.id ?? ""}
                      />
                    </CardBody>
                  </Card>

                  {user ? (
                    <NegotiationActions
                      application={app}
                      currentUserId={user.id}
                      pendingOffer={pending}
                    />
                  ) : null}
                </div>

                <div className="space-y-4">
                  <Card tone="money">
                    <CardBody>
                      <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
                        {app.agreedPrice ? "Agreed price" : "On the table"}
                      </p>
                      <Amount
                        minor={app.agreedPrice ?? pending?.amount ?? app.proposedPrice}
                        currency={app.currency}
                        variant="display"
                        className="mt-2 block text-2xl"
                      />
                      {app.agreedPrice ? (
                        <p className="text-muted mt-2 text-[11px] leading-relaxed">
                          This is what will be held in escrow once the brand funds the contract.
                        </p>
                      ) : null}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="space-y-3">
                      <div>
                        <p className="text-faint text-[10px] tracking-[0.14em] uppercase">
                          Opening proposal
                        </p>
                        <Amount
                          minor={app.proposedPrice}
                          currency={app.currency}
                          className="mt-1 block text-[13px]"
                        />
                      </div>
                      <div>
                        <p className="text-faint text-[10px] tracking-[0.14em] uppercase">
                          Estimated reach
                        </p>
                        <p className="tnum text-bone-2 mt-1 text-[13px]">
                          {formatNumber(app.estimatedReach)}
                        </p>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <p className="text-faint mb-2 text-[10px] tracking-[0.14em] uppercase">
                        The pitch
                      </p>
                      <p className="text-bone-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                        {app.proposal}
                      </p>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}
