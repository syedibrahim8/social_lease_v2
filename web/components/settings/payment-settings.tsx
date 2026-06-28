"use client";

import { toast } from "sonner";
import { CreditCard, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { ConnectStatusCard } from "@/components/wallet/connect-status-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CreatorPayoutSettings() {
  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Payouts</h3>
        <p className="text-muted-foreground text-sm">
          Your Stripe Connect account receives escrow-released payouts.
        </p>
      </div>
      <ConnectStatusCard />
    </div>
  );
}

function BrandPaymentSettings() {
  return (
    <Card className="max-w-xl gap-4 p-6">
      <div>
        <h3 className="text-sm font-semibold">Payment methods</h3>
        <p className="text-muted-foreground text-sm">
          Cards used to fund campaign escrow.
        </p>
      </div>
      <div className="border-border flex items-center gap-3 rounded-lg border p-3">
        <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
          <CreditCard className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Visa •••• 4242</p>
          <p className="text-muted-foreground text-xs">Expires 08/27</p>
        </div>
        <span className="bg-success-muted text-success-text ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
          Default
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          toast.message("Add payment method", {
            description: "Stripe card entry opens here.",
          })
        }
      >
        <Plus />
        Add payment method
      </Button>
    </Card>
  );
}

export function PaymentSettings() {
  const { role } = useAuth();
  return role === "BRAND" ? <BrandPaymentSettings /> : <CreatorPayoutSettings />;
}
