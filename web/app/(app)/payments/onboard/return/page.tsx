"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardReturnPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["connect-status"] });
  }, [queryClient]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
      <Card className="w-full items-center gap-3 p-8 text-center">
        <span className="bg-success-muted text-success-text flex size-11 items-center justify-center rounded-full">
          <BadgeCheck className="size-6" />
        </span>
        <h1 className="text-lg font-semibold">You&apos;re back from Stripe</h1>
        <p className="text-muted-foreground text-sm">
          If you finished onboarding, payouts are now enabled on your connected
          account. Your wallet reflects the latest status.
        </p>
        <Button asChild variant="brand" className="mt-2">
          <Link href="/wallet">Continue to Wallet</Link>
        </Button>
      </Card>
    </div>
  );
}
