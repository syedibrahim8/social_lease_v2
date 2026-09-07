"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Reply, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
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
import {
  acceptOffer,
  counterOffer,
  rejectOffer,
  withdrawApplication,
} from "@/lib/api/endpoints/applications";
import { invalidateFor, qk } from "@/lib/query";
import { refId, type Application, type Offer } from "@/lib/api/types";

/**
 * Turn-aware actions.
 *
 * The backend allows only the pending offer's RECEIVER to counter, accept or
 * reject. This mirrors that exactly: when it is not your turn the actions are
 * absent and a line says whose turn it is. Showing a button the server will
 * reject is worse than showing none.
 */
export function NegotiationActions({
  application,
  currentUserId,
  pendingOffer,
}: {
  application: Application;
  currentUserId: string;
  pendingOffer: Offer | undefined;
}) {
  const queryClient = useQueryClient();
  const [counterOpen, setCounterOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const settled =
    application.status === "ACCEPTED" ||
    application.status === "REJECTED" ||
    application.status === "WITHDRAWN";

  const myTurn = Boolean(pendingOffer && pendingOffer.receiver === currentUserId);

  const done = (label: string) => {
    invalidateFor(queryClient, "counter", [qk.application(application.id)]);
    toast.success(label);
  };

  const accept = useMutation({
    mutationFn: () => acceptOffer(application.id),
    onSuccess: () => {
      invalidateFor(queryClient, "accept", [qk.application(application.id)]);
      toast.success("Offer accepted. A contract has been created.");
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not accept."),
  });

  const reject = useMutation({
    mutationFn: () => rejectOffer(application.id),
    onSuccess: () => done("Offer rejected."),
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not reject."),
  });

  const withdraw = useMutation({
    mutationFn: () => withdrawApplication(application.id),
    onSuccess: () => done("Application withdrawn."),
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Could not withdraw."),
  });

  const counter = useMutation({
    mutationFn: () => {
      // The field is in whole currency; the API is in minor units.
      const minor = Math.round(Number(amount) * 100);
      return counterOffer(application.id, {
        amount: minor,
        ...(message.trim() ? { message: message.trim() } : {}),
      });
    },
    onSuccess: () => {
      setCounterOpen(false);
      setAmount("");
      setMessage("");
      done("Counter-offer sent.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not send the counter-offer."),
  });

  if (settled) return null;

  if (!myTurn) {
    return (
      <p className="border-line-2 text-muted rounded-lg border border-dashed px-4 py-3 text-xs">
        Waiting on the other side to respond. You will be able to reply once they do.
      </p>
    );
  }

  // Only the creator may withdraw, and only their own application.
  const isCreator = refId(application.creatorId) === currentUserId;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="gold" size="sm" loading={accept.isPending} onClick={() => accept.mutate()}>
          <Check />
          Accept{" "}
          {pendingOffer ? (
            <Amount minor={pendingOffer.amount} currency={application.currency} />
          ) : null}
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setCounterOpen(true)}>
          <Reply />
          Counter
        </Button>

        <Button variant="quiet" size="sm" loading={reject.isPending} onClick={() => reject.mutate()}>
          <X />
          Reject
        </Button>

        {isCreator ? (
          <Button
            variant="quiet"
            size="sm"
            loading={withdraw.isPending}
            onClick={() => withdraw.mutate()}
            className="ml-auto"
          >
            Withdraw
          </Button>
        ) : null}
      </div>

      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Counter-offer</DialogTitle>
            <DialogDescription>
              This replaces the offer on the table and passes the turn back to them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Field label={`Amount (${application.currency})`} htmlFor="counter-amount" required>
              <Input
                id="counter-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="tnum"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500.00"
              />
            </Field>

            <Field label="Message" htmlFor="counter-message" hint="Optional.">
              <Textarea
                id="counter-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why this figure works for you."
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="quiet" size="sm" onClick={() => setCounterOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              loading={counter.isPending}
              disabled={!amount || Number(amount) <= 0}
              onClick={() => counter.mutate()}
            >
              Send counter-offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
