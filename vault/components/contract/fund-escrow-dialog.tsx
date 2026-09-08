"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Amount } from "@/components/money/amount";
import { ApiError } from "@/lib/api/client";
import { createCheckout } from "@/lib/api/endpoints/payments";
import { estimateSplit } from "@/lib/money";
import type { Contract } from "@/lib/api/types";

/**
 * Funding escrow.
 *
 * The brand is about to hand money to the platform, so the dialog states three
 * things plainly before they do: what they pay, what the creator will receive,
 * and — the part people actually worry about — that the money is held rather
 * than forwarded, and only moves when they approve the work.
 */
export function FundEscrowDialog({
  contract,
  commissionPercent = 10,
}: {
  contract: Contract;
  commissionPercent?: number;
}) {
  const [open, setOpen] = useState(false);
  const { commissionAmount, creatorAmount } = estimateSplit(
    contract.agreedPrice,
    commissionPercent,
  );

  const checkout = useMutation({
    mutationFn: () => createCheckout(contract.id),
    onSuccess: ({ checkoutUrl }) => {
      // Full navigation, not router.push: this leaves the app for Stripe's
      // hosted page entirely.
      window.location.href = checkoutUrl;
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError ? error.message : "Could not start the payment.",
      );
    },
  });

  return (
    <>
      <Button variant="gold" onClick={() => setOpen(true)}>
        <Lock />
        Fund escrow
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fund this contract</DialogTitle>
            <DialogDescription>
              You will be taken to Stripe to pay. Nothing is charged until you complete it
              there.
            </DialogDescription>
          </DialogHeader>

          <dl className="border-line bg-emerald-lo space-y-2.5 rounded-xl border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-bone-2 text-[13px]">You pay</dt>
              <dd>
                <Amount
                  minor={contract.agreedPrice}
                  currency={contract.currency}
                  variant="display"
                  className="text-lg"
                />
              </dd>
            </div>
            <div className="border-line flex items-baseline justify-between gap-3 border-t pt-2.5">
              <dt className="text-muted text-xs">Platform fee</dt>
              <dd>
                <Amount
                  minor={commissionAmount}
                  currency={contract.currency}
                  className="text-[13px]"
                />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted text-xs">Creator receives on approval</dt>
              <dd>
                <Amount
                  minor={creatorAmount}
                  currency={contract.currency}
                  className="text-[13px]"
                />
              </dd>
            </div>
          </dl>

          <p className="text-muted mt-4 text-[12px] leading-relaxed">
            <strong className="text-bone-2 font-medium">The money is held, not sent.</strong>{" "}
            It stays with the platform until you approve the delivery. If you cancel before
            then, it comes back to you.
          </p>

          <DialogFooter>
            <Button variant="quiet" size="sm" onClick={() => setOpen(false)}>
              Not yet
            </Button>
            <Button
              variant="gold"
              size="sm"
              loading={checkout.isPending}
              onClick={() => checkout.mutate()}
            >
              Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
