"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getConnectStatus } from "@/lib/api/endpoints/payments";
import { qk } from "@/lib/query";

/**
 * Stripe's `return_url`.
 *
 * Landing here means the person came back from the hosted flow — NOT that they
 * finished it. Stripe returns you on completion and on abandonment alike, so
 * this asks the backend for the account's real state rather than congratulating
 * anyone on arrival. GET /payments/connect/status re-reads live from Stripe and
 * writes the result back, so it is accurate even before the account.updated
 * webhook lands.
 */
export default function OnboardReturnPage() {
  const status = useQuery({
    queryKey: qk.connectStatus(),
    queryFn: getConnectStatus,
    // The hosted flow can take a moment to settle on Stripe's side.
    refetchInterval: (q) => (q.state.data?.payoutsEnabled ? false : 2000),
  });

  if (status.isPending) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <Skeleton className="mx-auto size-12 rounded-2xl" />
        <Skeleton className="mx-auto h-7 w-56" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
    );
  }

  const ready = status.data?.payoutsEnabled === true;

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span
        className={
          ready
            ? "bg-positive/10 text-positive mx-auto grid size-12 place-items-center rounded-2xl"
            : "bg-warning/10 text-warning mx-auto grid size-12 place-items-center rounded-2xl"
        }
      >
        {ready ? (
          <BadgeCheck className="size-6" aria-hidden="true" />
        ) : (
          <Clock className="size-5" aria-hidden="true" />
        )}
      </span>

      <h1 className="font-display text-bone mt-4 text-2xl">
        {ready ? "Payouts are enabled" : "Not quite finished"}
      </h1>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">
        {ready
          ? "Your Stripe account is ready to receive money. Anything already approved will be paid out, and you can now apply to campaigns."
          : "Stripe still needs something from you before payouts can be enabled. This page checks again on its own, or you can pick up where you left off."}
      </p>

      <Card className="mt-6 text-left">
        <CardBody className="space-y-2.5">
          <Row label="Stripe account" value={status.data?.hasAccount ? "Connected" : "Not created"} />
          <Row
            label="Details submitted"
            value={status.data?.onboardingComplete ? "Yes" : "Not yet"}
          />
          <Row label="Payouts enabled" value={status.data?.payoutsEnabled ? "Yes" : "Not yet"} />
        </CardBody>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="gold" size="sm">
          <Link href="/wallet">
            <Wallet />
            Go to wallet
          </Link>
        </Button>
        {!ready ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/payments/onboard/refresh">Finish setup</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted text-xs">{label}</span>
      <span className="text-bone-2 text-[13px]">{value}</span>
    </div>
  );
}
