"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { getConnectStatus, startConnectOnboarding } from "@/lib/api/endpoints/payments";
import { qk } from "@/lib/query";

/**
 * Stripe Connect status and onboarding.
 *
 * This is not decoration: without a payout-ready account a creator cannot even
 * apply to a campaign, because the backend refuses to engage someone it could
 * not later pay. So an incomplete state is stated as a blocker with the fix
 * attached, rather than as a quiet grey badge.
 */
export function ConnectStatusCard() {
  const [redirecting, setRedirecting] = useState(false);

  const status = useQuery({
    queryKey: qk.connectStatus(),
    queryFn: getConnectStatus,
  });

  const onConnect = async () => {
    setRedirecting(true);
    try {
      const { onboardingUrl } = await startConnectOnboarding();
      window.location.href = onboardingUrl;
    } catch (error) {
      setRedirecting(false);
      toast.error(
        error instanceof ApiError ? error.message : "Could not start payout setup.",
      );
    }
  };

  if (status.isPending) {
    return (
      <Card>
        <CardBody>
          <Skeleton className="h-10 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (status.data?.payoutsEnabled) {
    return (
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-positive/10 text-positive grid size-9 shrink-0 place-items-center rounded-lg">
              <BadgeCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-bone text-[13px] font-medium">Payouts enabled</p>
              <p className="text-muted mt-0.5 text-xs">
                Released money goes straight to your connected Stripe account.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const started = status.data?.hasAccount;

  return (
    <Card tone="money">
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="bg-warning/10 text-warning grid size-9 shrink-0 place-items-center rounded-lg">
            <CreditCard className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-bone text-[13px] font-medium">
              {started ? "Finish your payout setup" : "Set up payouts to get started"}
            </p>
            <p className="text-muted mt-1 max-w-[54ch] text-xs leading-relaxed">
              {started
                ? "Stripe still needs a few details before it can send you money."
                : "Brands fund escrow before you start, so we need somewhere to send the money once work is approved. You cannot apply to campaigns until this is done."}
            </p>
          </div>
        </div>
        <Button variant="gold" loading={redirecting} onClick={() => void onConnect()}>
          {started ? "Resume setup" : "Set up payouts"}
        </Button>
      </CardBody>
    </Card>
  );
}
