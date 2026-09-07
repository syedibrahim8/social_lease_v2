"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import { getContracts } from "@/lib/api/endpoints/contracts";
import { ASSET_TYPE_LABEL, CONTRACT_STATUS } from "@/lib/config/labels";
import { refOrNull } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

/** Statuses that need someone to act, so they can be surfaced first. */
const NEEDS_ACTION = new Set(["PENDING_FUNDING", "SUBMITTED", "APPROVED"]);

export default function ContractsPage() {
  const { role } = useAuth();
  const isCreator = role === "CREATOR";

  const query = useQuery({
    queryKey: qk.contracts(),
    queryFn: () => getContracts(),
  });

  return (
    <>
      <PageHeader
        title="Contracts"
        description={
          isCreator
            ? "Agreed work, what has been funded, and where each payout stands."
            : "Agreed work, what you have funded, and what is waiting on your review."
        }
      />

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i}>
                <CardBody className="space-y-3">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-4 w-28" />
                </CardBody>
              </Card>
            ))}
          </div>
        }
      >
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No contracts yet"
              description={
                isCreator
                  ? "A contract is created the moment an offer is accepted. Apply to a campaign to get there."
                  : "A contract is created the moment you accept a creator's offer. Start from a negotiation."
              }
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/negotiations">Go to negotiations</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {[...page.items]
                .sort(
                  (a, b) =>
                    Number(NEEDS_ACTION.has(b.status)) - Number(NEEDS_ACTION.has(a.status)),
                )
                .map((contract) => {
                  const status = CONTRACT_STATUS[contract.status];
                  const campaign = refOrNull(contract.campaignId);
                  const other = refOrNull(isCreator ? contract.brandId : contract.creatorId);

                  return (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className="group block"
                    >
                      <Card className="hover:border-line transition-colors">
                        <CardBody className="flex flex-wrap items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                              <Badge tone={status.tone}>{status.label}</Badge>
                              <Badge tone="muted">
                                {ASSET_TYPE_LABEL[contract.assetType]}
                              </Badge>
                            </div>
                            <p className="text-bone group-hover:text-gold-lo truncate text-sm font-medium transition-colors">
                              {campaign?.title ?? "Contract"}
                            </p>
                            <p className="text-muted mt-0.5 truncate text-xs">
                              {isCreator ? "Brand" : "Creator"}: {other?.name ?? "—"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-faint text-[10px] tracking-[0.14em] uppercase">
                              Agreed
                            </p>
                            <Amount
                              minor={contract.agreedPrice}
                              currency={contract.currency}
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
