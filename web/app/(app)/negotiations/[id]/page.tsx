"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import { getNegotiation } from "@/lib/api/endpoints/negotiations";
import { useAuth } from "@/lib/auth/auth-provider";
import { OfferThread } from "@/components/negotiations/offer-thread";
import { NegotiationActions } from "@/components/negotiations/negotiation-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/status-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import type { Negotiation, Offer } from "@/lib/api/mock/negotiations";

export default function NegotiationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useAuth();
  const query = useQuery({
    queryKey: ["negotiation", id],
    queryFn: () => getNegotiation(id),
  });
  const [override, setOverride] = useState<Negotiation | null>(null);
  const neg = override ?? query.data ?? null;

  const mutate = (fn: (n: Negotiation) => Negotiation, msg: string) => {
    if (!neg) return;
    setOverride(fn(neg));
    toast.success(msg);
  };

  const now = () => new Date().toISOString();

  const onAccept = () =>
    mutate(
      (n) => ({
        ...n,
        status: "ACCEPTED",
        updatedAt: now(),
        offers: n.offers.map((o) =>
          o.status === "PENDING" ? { ...o, status: "ACCEPTED" } : o,
        ),
      }),
      "Offer accepted — a contract has been created",
    );

  const onReject = () =>
    mutate(
      (n) => ({
        ...n,
        status: "REJECTED",
        updatedAt: now(),
        offers: n.offers.map((o) =>
          o.status === "PENDING" ? { ...o, status: "REJECTED" } : o,
        ),
      }),
      "Offer rejected",
    );

  const onWithdraw = () =>
    mutate((n) => ({ ...n, status: "WITHDRAWN", updatedAt: now() }), "Application withdrawn");

  const onCounter = (amount: number, message: string) =>
    mutate((n) => {
      const offers: Offer[] = n.offers.map((o) =>
        o.status === "PENDING" ? { ...o, status: "COUNTERED" } : o,
      );
      const next: Offer = {
        id: `o${n.offers.length + 1}`,
        sender: role === "BRAND" ? "BRAND" : "CREATOR",
        amount,
        message: message || undefined,
        status: "PENDING",
        at: now(),
      };
      return { ...n, status: "NEGOTIATING", updatedAt: now(), offers: [...offers, next] };
    }, "Counter offer sent");

  if (query.isPending && !override) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (query.isError) return <ErrorState onRetry={query.refetch} />;

  if (!neg) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={<MessagesSquare />}
          title="Negotiation not found"
          description="It may have been removed or the link is incorrect."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/negotiations">Back to negotiations</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/negotiations"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to negotiations
      </Link>

      <Card className="gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{neg.campaignTitle}</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {neg.brandName} · {neg.creatorName}
            </p>
          </div>
          <StatusBadge domain="application" status={neg.status} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{neg.platform}</Badge>
          <Badge variant="outline">{neg.assetType}</Badge>
        </div>
      </Card>

      <OfferThread
        offers={neg.offers}
        role={role}
        brandName={neg.brandName}
        creatorName={neg.creatorName}
        currency={neg.currency}
      />

      <NegotiationActions
        negotiation={neg}
        role={role}
        onAccept={onAccept}
        onReject={onReject}
        onWithdraw={onWithdraw}
        onCounter={onCounter}
      />
    </div>
  );
}
