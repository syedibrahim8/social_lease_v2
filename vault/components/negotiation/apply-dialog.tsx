"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
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
import { apply } from "@/lib/api/endpoints/applications";
import { invalidateFor } from "@/lib/query";
import type { Campaign } from "@/lib/api/types";

/**
 * The backend refuses an application from a creator with no payout-ready Stripe
 * account, so escrow can never be funded for work it could not pay out. That is
 * a real product state and it deserves a real screen, not a toast: the raw
 * message even names an API path, which is fine for a developer and useless to
 * a creator.
 */
function isPayoutGate(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 403 &&
    /payout|connect|stripe/i.test(error.message)
  );
}

export function ApplyDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("");
  const [reach, setReach] = useState("");
  const [proposal, setProposal] = useState("");
  const [blockedOnPayouts, setBlockedOnPayouts] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apply({
        campaignId: campaign.id,
        proposal: proposal.trim(),
        // The field is whole currency; the API is minor units.
        proposedPrice: Math.round(Number(price) * 100),
        estimatedReach: Math.round(Number(reach)),
      }),
    onSuccess: (application) => {
      invalidateFor(queryClient, "apply");
      onOpenChange(false);
      toast.success("Application sent. Your opening offer is on the table.");
      router.push(`/negotiations/${application.id}`);
    },
    onError: (error: unknown) => {
      if (isPayoutGate(error)) {
        setBlockedOnPayouts(true);
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Could not send the application.");
    },
  });

  // The backend requires a proposal of at least 10 characters, so the button
  // mirrors that rather than letting the server reject it.
  const valid =
    proposal.trim().length >= 10 && Number(price) > 0 && Number(reach) >= 0 && reach !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {blockedOnPayouts ? (
          <>
            <DialogHeader>
              <DialogTitle>Set up payouts first</DialogTitle>
              <DialogDescription>
                Brands fund escrow before you start, so we need somewhere to send the money
                when the work is approved. Connecting a Stripe account takes a few minutes and
                only has to be done once.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="quiet" size="sm" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link href="/wallet">
                  <Wallet />
                  Set up payouts
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply to this campaign</DialogTitle>
              <DialogDescription>
                Your price becomes the opening offer. The brand can accept it or counter.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="border-line bg-emerald-lo rounded-lg border px-3.5 py-2.5">
                <p className="text-muted text-[10px] font-semibold tracking-[0.14em] uppercase">
                  Their budget
                </p>
                <p className="mt-1 text-[13px]">
                  <Amount minor={campaign.budgetMin} currency={campaign.currency} />
                  <span className="text-faint mx-1">to</span>
                  <Amount minor={campaign.budgetMax} currency={campaign.currency} />
                </p>
              </div>

              <Field label={`Your price (${campaign.currency})`} htmlFor="apply-price" required>
                <Input
                  id="apply-price"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="tnum"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2500.00"
                />
              </Field>

              <Field
                label="Estimated reach"
                htmlFor="apply-reach"
                hint="Roughly how many people will see this."
                required
              >
                <Input
                  id="apply-reach"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className="tnum"
                  value={reach}
                  onChange={(e) => setReach(e.target.value)}
                  placeholder="50000"
                />
              </Field>

              <Field
                label="Your pitch"
                htmlFor="apply-proposal"
                hint="At least 10 characters. What you would make, and why you."
                required
              >
                <Textarea
                  id="apply-proposal"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  placeholder="How you would approach this brief."
                />
              </Field>
            </div>

            <DialogFooter>
              <Button variant="quiet" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={!valid}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                Send application
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
