"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Amount } from "@/components/money/amount";
import { EscrowTracker } from "@/components/money/escrow-tracker";
import { getContract } from "@/lib/api/endpoints/contracts";
import { getPaymentForContract } from "@/lib/api/endpoints/payments";
import { qk } from "@/lib/query";

const POLL_MS = 1_500;
const GIVE_UP_MS = 20_000;

/**
 * Where Stripe sends the brand after a successful payment.
 *
 * This page exists because of a race, and its whole design is that race. Stripe
 * redirects the browser the moment the card is charged, but escrow is only
 * really funded when OUR webhook arrives and flips the payment to PAID. Those
 * two events are not ordered, and the webhook is usually the slower one.
 *
 * So the page never asserts what it has not confirmed. It polls the contract
 * until the backend agrees the money landed; if that has not happened within
 * twenty seconds it says exactly that, rather than showing a tick it cannot
 * back up. Claiming a payment succeeded when the server does not yet agree is
 * the single worst thing this screen could do.
 *
 * It polls GET /contracts/:id rather than the payment, because GET /payments
 * accepts only page/limit/status — there is no contractId filter.
 */
export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const { contractId } = use(searchParams);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(timer);
  }, []);

  const contract = useQuery({
    queryKey: qk.contract(contractId ?? ""),
    queryFn: () => getContract(contractId as string),
    enabled: Boolean(contractId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const settled = status !== undefined && status !== "PENDING_FUNDING";
      return settled || gaveUp ? false : POLL_MS;
    },
  });

  const confirmed =
    contract.data !== undefined && contract.data.status !== "PENDING_FUNDING";

  // Only fetched once the backend agrees, so the receipt shows the REAL split
  // that was frozen at checkout rather than an estimate.
  const payment = useQuery({
    queryKey: qk.payment(contractId ?? ""),
    queryFn: () => getPaymentForContract(contractId as string),
    enabled: Boolean(contractId) && confirmed,
  });

  if (!contractId) {
    return (
      <Shell
        tone="warning"
        icon={<Clock className="size-5" />}
        title="We can't tell which contract this was"
        body="The return link was missing its contract reference. Your payment is safe; open the contract to see its current state."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/contracts">Go to contracts</Link>
          </Button>
        }
      />
    );
  }

  if (contract.isPending) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <Skeleton className="mx-auto size-12 rounded-2xl" />
        <Skeleton className="mx-auto h-7 w-56" />
        <Skeleton className="mx-auto h-4 w-72" />
      </div>
    );
  }

  if (!confirmed && gaveUp) {
    return (
      <Shell
        tone="warning"
        icon={<Clock className="size-5" />}
        title="Stripe has your payment"
        body="We're still waiting for confirmation on our side. This is normal and usually clears in a moment. This page updates itself, and you'll get a notification the moment escrow is funded."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="gold" size="sm" onClick={() => void contract.refetch()}>
              Check again
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/contracts/${contractId}`}>Open the contract</Link>
            </Button>
          </div>
        }
      />
    );
  }

  if (!confirmed) {
    return (
      <Shell
        tone="pending"
        icon={<Clock className="size-5 animate-pulse" />}
        title="Confirming with Stripe"
        body="Your card has been charged. We're waiting for confirmation before marking escrow funded."
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="text-center">
        <span className="bg-positive/10 text-positive mx-auto grid size-12 place-items-center rounded-2xl">
          <BadgeCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-bone mt-4 text-2xl">Escrow funded</h1>
        <p className="text-muted mt-2 text-[13px] leading-relaxed">
          The money is held by the platform. It goes to the creator when you approve their
          delivery, and back to you if the contract is cancelled first.
        </p>
      </div>

      <Card tone="money" className="mt-7">
        <CardBody className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
              Held in escrow
            </span>
            <Amount
              minor={contract.data.agreedPrice}
              currency={contract.data.currency}
              variant="display"
              className="text-2xl"
            />
          </div>

          {payment.data ? (
            <dl className="border-line space-y-2 border-t pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted text-xs">Platform fee</dt>
                <dd>
                  <Amount
                    minor={payment.data.commissionAmount}
                    currency={payment.data.currency}
                    className="text-[13px]"
                  />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-bone-2 text-xs">Creator receives on approval</dt>
                <dd>
                  <Amount
                    minor={payment.data.creatorAmount}
                    currency={payment.data.currency}
                    className="text-bone text-[13px]"
                  />
                </dd>
              </div>
            </dl>
          ) : null}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <p className="text-bone mb-3 text-[13px] font-medium">What happens next</p>
          <EscrowTracker status={contract.data.status} />
        </CardBody>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button asChild variant="gold" size="sm">
          <Link href={`/contracts/${contractId}`}>
            <FileText />
            Open the contract
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Shell({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: "warning" | "pending";
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span
        className={
          tone === "warning"
            ? "bg-warning/10 text-warning mx-auto grid size-12 place-items-center rounded-2xl"
            : "bg-gold/10 text-gold-lo mx-auto grid size-12 place-items-center rounded-2xl"
        }
      >
        {icon}
      </span>
      <h1 className="font-display text-bone mt-4 text-2xl">{title}</h1>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
