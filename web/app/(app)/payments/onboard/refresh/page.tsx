import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardRefreshPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
      <Card className="w-full items-center gap-3 p-8 text-center">
        <span className="bg-warning-muted text-warning-text flex size-11 items-center justify-center rounded-full">
          <RefreshCw className="size-6" />
        </span>
        <h1 className="text-lg font-semibold">Onboarding link expired</h1>
        <p className="text-muted-foreground text-sm">
          Your Stripe setup link expired or was interrupted. You can restart the
          payout onboarding from your wallet.
        </p>
        <Button asChild variant="brand" className="mt-2">
          <Link href="/wallet">Back to Wallet</Link>
        </Button>
      </Card>
    </div>
  );
}
