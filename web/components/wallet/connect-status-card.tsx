"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CreatorWallet } from "@/lib/api/mock/wallet";

/** Stripe Connect status. Demonstrates the onboarding toggle (mock). */
export function ConnectStatusCard({ wallet }: { wallet: CreatorWallet }) {
  const [connected, setConnected] = useState(wallet.stripeConnected);

  if (connected) {
    return (
      <Card className="flex-row items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="bg-success-muted text-success-text flex size-9 items-center justify-center rounded-lg">
            <BadgeCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Stripe Connect active</p>
            <p className="text-muted-foreground tabular text-xs">
              Payouts enabled · {wallet.stripeAccountId}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.message("Stripe dashboard", {
              description: "Opens the connected account dashboard.",
            })
          }
        >
          Manage
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="bg-warning-muted text-warning-text flex size-9 items-center justify-center rounded-lg">
          <CreditCard className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium">Connect a payout account</p>
          <p className="text-muted-foreground text-xs">
            Set up Stripe Connect to receive escrow-released payouts.
          </p>
        </div>
      </div>
      <Button
        variant="brand"
        className="w-full"
        onClick={() => {
          setConnected(true);
          toast.success("Stripe Connect set up", {
            description: "Payouts are now enabled.",
          });
        }}
      >
        Connect with Stripe
      </Button>
    </Card>
  );
}
