"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { DeliverablesList } from "@/components/contract/deliverables-list";
import { TermsPanel } from "@/components/contract/terms-panel";
import { EscrowTracker } from "@/components/money/escrow-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FundEscrowDialog } from "@/components/contract/fund-escrow-dialog";
import { ApiError } from "@/lib/api/client";
import { cancelContract, getContract } from "@/lib/api/endpoints/contracts";
import { getPaymentForContract } from "@/lib/api/endpoints/payments";
import { ASSET_TYPE_LABEL, CONTRACT_STATUS, PLATFORM_LABEL } from "@/lib/config/labels";
import { refOrNull } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { invalidateFor, qk } from "@/lib/query";

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.contract(id),
    queryFn: () => getContract(id),
  });

  // Only exists once escrow has been funded. Until then the terms panel falls
  // back to an estimate and says so.
  const payment = useQuery({
    queryKey: qk.payment(id),
    queryFn: () => getPaymentForContract(id),
    enabled: query.data !== undefined && query.data.status !== "PENDING_FUNDING",
  });

  const cancel = useMutation({
    mutationFn: () => cancelContract(id),
    onSuccess: () => {
      invalidateFor(queryClient, "refund", [qk.contract(id)]);
      toast.success("Contract cancelled.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not cancel this contract."),
  });

  return (
    <>
      <Link
        href="/contracts"
        className="text-muted hover:text-bone mb-5 inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All contracts
      </Link>

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          </div>
        }
      >
        {(contract) => {
          const status = CONTRACT_STATUS[contract.status];
          const campaign = refOrNull(contract.campaignId);
          const isCreator = role === "CREATOR";
          const other = refOrNull(isCreator ? contract.brandId : contract.creatorId);

          // Cancelling is only permitted before money moves. Once escrow is
          // funded the exit is a refund, which lives with the money actions.
          const canCancel = contract.status === "PENDING_FUNDING";

          return (
            <>
              <PageHeader
                title={campaign?.title ?? "Contract"}
                description={`${isCreator ? "Brand" : "Creator"}: ${other?.name ?? "—"}`}
                action={
                  canCancel ? (
                    <Button
                      variant="quiet"
                      size="sm"
                      loading={cancel.isPending}
                      onClick={() => cancel.mutate()}
                    >
                      Cancel contract
                    </Button>
                  ) : undefined
                }
              />

              <div className="mb-6 flex flex-wrap items-center gap-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                <Badge tone="muted">{ASSET_TYPE_LABEL[contract.assetType]}</Badge>
                <Badge tone="muted">{PLATFORM_LABEL[contract.platform]}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <Card>
                    <CardBody>
                      <h2 className="text-bone mb-3 text-[13px] font-medium">Where this stands</h2>
                      <EscrowTracker status={contract.status} />
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <h2 className="text-bone mb-3 text-[13px] font-medium">Deliverables</h2>
                      <DeliverablesList deliverables={contract.deliverables} />
                    </CardBody>
                  </Card>

                  {/* Money actions. Only the brand can move money, and only
                      while the contract is waiting to be funded. */}
                  {!isCreator && contract.status === "PENDING_FUNDING" ? (
                    <Card>
                      <CardBody className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-bone text-[13px] font-medium">
                            This contract is not funded yet
                          </p>
                          <p className="text-muted mt-1 max-w-[52ch] text-xs leading-relaxed">
                            The creator starts once the money is in escrow. Nothing reaches
                            them until you approve the delivery.
                          </p>
                        </div>
                        <FundEscrowDialog contract={contract} />
                      </CardBody>
                    </Card>
                  ) : null}

                  {isCreator && contract.status === "PENDING_FUNDING" ? (
                    <Card>
                      <CardBody>
                        <p className="text-muted text-xs leading-relaxed">
                          Waiting on the brand to fund escrow. You will be notified the moment
                          the money is held, and that is the point to start work.
                        </p>
                      </CardBody>
                    </Card>
                  ) : null}

                  {/* Delivery and payout actions mount here in the next tasks. */}
                </div>

                <div className="space-y-4">
                  <TermsPanel contract={contract} payment={payment.data} />

                  <Card>
                    <CardBody>
                      <p className="text-faint text-[10px] tracking-[0.14em] uppercase">
                        Timeline
                      </p>
                      <p className="tnum text-bone mt-2 flex items-center gap-1.5 text-[13px]">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {contract.timeline.durationDays} days
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
