"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  getConnectStatus,
  startConnectOnboarding,
} from "@/lib/api/endpoints/payments";

/** Stripe Connect status + onboarding. Live mode redirects to Stripe's hosted flow. */
export function ConnectStatusCard() {
  const { isMock } = useAuth();
  const query = useQuery({ queryKey: ["connect-status"], queryFn: getConnectStatus });
  const [redirecting, setRedirecting] = useState(false);

  const onConnect = async () => {
    if (isMock) {
      toast.message("Stripe Connect", {
        description: "Hosted onboarding opens here in live mode.",
      });
      return;
    }
    setRedirecting(true);
    try {
      const url = await startConnectOnboarding();
      window.location.href = url;
    } catch (e) {
      setRedirecting(false);
      toast.error("Could not start onboarding", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  if (query.isPending) {
    return (
      <Card className="p-5">
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const status = query.data;

  if (status?.payoutsEnabled) {
    return (
      <Card className="flex-row items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="bg-success-muted text-success-text flex size-9 items-center justify-center rounded-lg">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Stripe Connect active</p>
            <p className="text-muted-foreground text-xs">
              Payouts enabled on your connected account.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.message("Stripe dashboard", {
              description: "Opens your connected account dashboard.",
            })
          }
        >
          Manage
        </Button>
      </Card>
    );
  }

  const hasAccount = status?.hasAccount;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="bg-warning-muted text-warning-text flex size-9 items-center justify-center rounded-lg">
          <CreditCard className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium">
            {hasAccount ? "Finish payout setup" : "Connect a payout account"}
          </p>
          <p className="text-muted-foreground text-xs">
            {hasAccount
              ? "Your Stripe onboarding is incomplete. Resume to enable payouts."
              : "Set up Stripe Connect to receive escrow-released payouts."}
          </p>
        </div>
      </div>
      <Button
        variant="brand"
        className="w-full"
        loading={redirecting}
        onClick={onConnect}
      >
        {hasAccount ? "Resume setup" : "Connect with Stripe"}
      </Button>
    </Card>
  );
}
