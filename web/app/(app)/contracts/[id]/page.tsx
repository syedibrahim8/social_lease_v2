"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarClock, FileText } from "lucide-react";
import { getContract } from "@/lib/api/endpoints/contracts";
import { useAuth } from "@/lib/auth/auth-provider";
import { DeliverablesList } from "@/components/contracts/deliverables-list";
import { DeliveryPanel } from "@/components/contracts/delivery-panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { formatDate, formatMoney } from "@/lib/format";
import type { Contract, ProofItem } from "@/lib/api/mock/contracts";

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const query = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContract(id),
  });
  const [override, setOverride] = useState<Contract | null>(null);
  const contract = override ?? query.data ?? null;

  const mutate = (fn: (c: Contract) => Contract, msg: string) => {
    if (!contract) return;
    setOverride(fn(contract));
    toast.success(msg);
  };
  const now = () => new Date().toISOString();

  const onSubmitDelivery = (proof: ProofItem[], note?: string) =>
    mutate((c) => {
      const prev = c.submission;
      const revision =
        prev && prev.status === "REVISION_REQUESTED"
          ? prev.revision + 1
          : (prev?.revision ?? 0);
      return {
        ...c,
        status: "SUBMITTED",
        updatedAt: now(),
        submission: {
          id: prev?.id ?? `sub_${c.id}`,
          status: "SUBMITTED",
          revision,
          proof,
          note,
          submittedAt: now(),
        },
      };
    }, "Delivery submitted for review");

  const onApprove = () =>
    mutate(
      (c) => ({
        ...c,
        status: "COMPLETED",
        updatedAt: now(),
        submission: c.submission ? { ...c.submission, status: "APPROVED" } : null,
      }),
      "Delivery approved — payout released",
    );

  const onRequestRevision = (note: string) =>
    mutate(
      (c) => ({
        ...c,
        status: "IN_PROGRESS",
        updatedAt: now(),
        submission: c.submission
          ? { ...c.submission, status: "REVISION_REQUESTED", reviewNote: note }
          : null,
      }),
      "Revision requested",
    );

  const onReject = (note?: string) =>
    mutate(
      (c) => ({
        ...c,
        status: "IN_PROGRESS",
        updatedAt: now(),
        submission: c.submission
          ? { ...c.submission, status: "REJECTED", reviewNote: note }
          : null,
      }),
      "Delivery rejected",
    );

  const onRefund = () =>
    mutate(
      (c) => ({ ...c, status: "CANCELLED", updatedAt: now() }),
      "Refund issued — contract cancelled",
    );

  const onFund = () =>
    mutate((c) => ({ ...c, status: "FUNDED", updatedAt: now() }), "Contract funded");

  const onCancel = () =>
    mutate(
      (c) => ({ ...c, status: "CANCELLED", updatedAt: now() }),
      "Contract cancelled",
    );

  if (query.isPending && !override) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (query.isError) return <ErrorState onRetry={query.refetch} />;

  if (!contract) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={<FileText />}
          title="Contract not found"
          description="It may have been removed or the link is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/contracts">Back to contracts</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/contracts"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to contracts
      </Link>

      <Card className="gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{contract.campaignTitle}</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {contract.brandName} · {contract.creatorName}
            </p>
          </div>
          <StatusBadge domain="contract" status={contract.status} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Agreed price
            </p>
            <p className="tabular mt-0.5 text-2xl font-semibold">
              {formatMoney(contract.agreedPrice, contract.currency)}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant="secondary">{contract.platform}</Badge>
            <Badge variant="outline">{contract.assetType}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <DeliveryPanel
            contract={contract}
            role={role}
            onSubmitDelivery={onSubmitDelivery}
            onApprove={onApprove}
            onRequestRevision={onRequestRevision}
            onReject={onReject}
            onRefund={onRefund}
            onFund={onFund}
            onCancel={onCancel}
          />
        </div>

        <div className="space-y-4">
          <Card className="gap-3 p-5">
            <h3 className="text-sm font-semibold">Terms</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Timeline</dt>
                <dd className="inline-flex items-center gap-1.5">
                  <CalendarClock className="text-muted-foreground size-3.5" />
                  {contract.durationDays} days
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{formatDate(contract.createdAt)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Commission</dt>
                <dd>10%</dd>
              </div>
            </dl>
          </Card>

          <Card className="gap-3 p-5">
            <h3 className="text-sm font-semibold">Deliverables</h3>
            <Separator />
            <DeliverablesList items={contract.deliverables} />
          </Card>
        </div>
      </div>
    </div>
  );
}
