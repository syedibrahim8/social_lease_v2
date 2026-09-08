"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Banknote, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PayoutRelease } from "@/components/motion/payout-release";
import { ApiError } from "@/lib/api/client";
import { refundPayment, releasePayment } from "@/lib/api/endpoints/payments";
import { invalidateFor, qk } from "@/lib/query";
import type { Contract, Payment } from "@/lib/api/types";

/**
 * Release and refund, shown exactly when the backend would allow them.
 *
 *   RELEASE  contract APPROVED and payment still PAID. That combination means
 *            the automatic payout on approval did not complete — almost always
 *            because the creator had not finished Stripe onboarding yet. The
 *            backend leaves the contract APPROVED so it can be completed later,
 *            and this is that later.
 *
 *   REFUND   payment PAID and contract NOT APPROVED, i.e. across FUNDED,
 *            IN_PROGRESS and SUBMITTED. Once a delivery is approved the exit is
 *            a payout, not a refund, and the backend returns 409 — so the
 *            button disappears rather than offering something that will fail.
 *
 * Neither is optimistic. Money never moves on screen before it has moved on the
 * server.
 */
export function MoneyActions({
  contract,
  payment,
  isCreator,
}: {
  contract: Contract;
  payment: Payment | null | undefined;
  isCreator: boolean;
}) {
  const queryClient = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [releasedAmount, setReleasedAmount] = useState<number | null>(null);

  const canRelease =
    !isCreator && contract.status === "APPROVED" && payment?.status === "PAID";
  const canRefund =
    !isCreator && payment?.status === "PAID" && contract.status !== "APPROVED";

  const release = useMutation({
    mutationFn: () => releasePayment(contract.id),
    onSuccess: (updated) => {
      invalidateFor(queryClient, "release", [
        qk.contract(contract.id),
        qk.payment(contract.id),
      ]);
      setReleasedAmount(updated.creatorAmount);
      toast.success("Payout released to the creator.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not release the payout."),
  });

  const refund = useMutation({
    mutationFn: () => refundPayment(contract.id),
    onSuccess: () => {
      invalidateFor(queryClient, "refund", [qk.contract(contract.id), qk.payment(contract.id)]);
      setRefundOpen(false);
      setConfirmText("");
      toast.success("Refunded. The contract has been cancelled.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not refund this contract."),
  });

  // The set-piece, once, right after a successful release.
  if (releasedAmount !== null && payment) {
    return (
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-bone text-[13px] font-medium">Payout released</h2>
          <PayoutRelease
            amount={releasedAmount}
            escrowBefore={releasedAmount}
            availableBefore={0}
            currency={payment.currency}
          />
        </CardBody>
      </Card>
    );
  }

  if (!canRelease && !canRefund) return null;

  return (
    <>
      {canRelease ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-bone text-[13px] font-medium">Payout is still pending</p>
              <p className="text-muted mt-1 max-w-[54ch] text-xs leading-relaxed">
                You approved this delivery, but the transfer has not completed. This usually
                means the creator had not finished their payout setup at the time. You can
                release it now.
              </p>
            </div>
            <Button
              variant="gold"
              loading={release.isPending}
              onClick={() => release.mutate()}
            >
              <Banknote />
              Release{" "}
              <Amount minor={payment.creatorAmount} currency={payment.currency} />
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {canRefund ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-bone text-[13px] font-medium">Need to cancel?</p>
              <p className="text-muted mt-1 max-w-[54ch] text-xs leading-relaxed">
                Refunding returns the escrowed money to you and cancels the contract. Once you
                approve a delivery this is no longer possible.
              </p>
            </div>
            <Button variant="danger" onClick={() => setRefundOpen(true)}>
              <Undo2 />
              Refund
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund and cancel this contract</DialogTitle>
            <DialogDescription>
              The full amount returns to your card and the contract is cancelled. The creator
              keeps nothing, and this cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="border-negative/25 bg-negative/[0.04] flex items-start gap-2.5 rounded-xl border px-4 py-3">
            <AlertTriangle className="text-negative mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-bone-2 text-[13px]">
                Refunding <Amount minor={contract.agreedPrice} currency={contract.currency} />
              </p>
              <p className="text-muted mt-1 text-[11px] leading-relaxed">
                If work has already been delivered, consider requesting changes instead.
              </p>
            </div>
          </div>

          {/* Typed confirmation: a destructive, irreversible money action should
              take more than one stray click. */}
          <Field
            label="Type REFUND to confirm"
            htmlFor="refund-confirm"
            className="mt-4"
            required
          >
            <Input
              id="refund-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="REFUND"
              autoComplete="off"
            />
          </Field>

          <DialogFooter>
            <Button variant="quiet" size="sm" onClick={() => setRefundOpen(false)}>
              Keep the contract
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={confirmText.trim().toUpperCase() !== "REFUND"}
              loading={refund.isPending}
              onClick={() => refund.mutate()}
            >
              Refund and cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
