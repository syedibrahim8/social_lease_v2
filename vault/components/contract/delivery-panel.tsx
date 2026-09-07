"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, PackageCheck, Send, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProofForm, type ProofDraft } from "@/components/contract/proof-form";
import { ProofDisplay } from "@/components/contract/proof-display";
import { Amount } from "@/components/money/amount";
import { ApiError } from "@/lib/api/client";
import {
  approveSubmission,
  createSubmission,
  getSubmissionsForContract,
  rejectSubmission,
  requestRevision,
  submitSubmission,
  updateSubmission,
} from "@/lib/api/endpoints/submissions";
import { SUBMISSION_STATUS } from "@/lib/config/labels";
import { invalidateFor, qk } from "@/lib/query";
import type { Contract, Submission } from "@/lib/api/types";

const EMPTY: ProofDraft = { files: [], links: [], note: "" };

/** DRAFT / SUBMITTED / REVISION_REQUESTED — the one delivery currently in play. */
function activeOf(list: Submission[]): Submission | undefined {
  return list.find(
    (s) => s.status === "DRAFT" || s.status === "SUBMITTED" || s.status === "REVISION_REQUESTED",
  );
}

/**
 * Proof of delivery, from both sides.
 *
 * Creator: build a draft, then submit it. Brand: read the proof and approve,
 * reject or send it back. The backend hides a creator's DRAFT from the brand,
 * so unfinished work is never on show.
 */
export function DeliveryPanel({
  contract,
  isCreator,
}: {
  contract: Contract;
  isCreator: boolean;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProofDraft>(EMPTY);
  const [reviewOpen, setReviewOpen] = useState<null | "reject" | "revision" | "approve">(null);
  const [reviewNote, setReviewNote] = useState("");

  const submissions = useQuery({
    queryKey: qk.submissionsForContract(contract.id),
    queryFn: () => getSubmissionsForContract(contract.id),
    enabled: contract.status !== "PENDING_FUNDING",
  });

  const list = submissions.data ?? [];
  const active = activeOf(list);
  const latest = active ?? list[0];

  /*
    Hydrate the editor from the delivery being edited.

    PATCH replaces `files` and `links` wholesale, so an editor that starts empty
    would submit only what was added in this sitting and silently drop proof the
    creator had already provided. That is data loss, and on a revision — the one
    time there is definitely existing proof — it is guaranteed.

    Adjusting state during render (rather than in an effect) is the pattern React
    documents for "reset state when a prop changes": it re-renders immediately
    without painting the wrong value first.
  */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  if (active && hydratedFor !== active.id) {
    setHydratedFor(active.id);
    setDraft({
      files: active.files,
      links: active.links,
      note: active.note ?? "",
    });
  }

  const after = (message: string) => {
    invalidateFor(queryClient, "submit", [
      qk.contract(contract.id),
      qk.submissionsForContract(contract.id),
    ]);
    toast.success(message);
  };

  const fail = (fallback: string) => (e: unknown) =>
    toast.error(e instanceof ApiError ? e.message : fallback);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...(draft.files.length ? { files: draft.files } : {}),
        ...(draft.links.length ? { links: draft.links } : {}),
        ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
      };
      return active
        ? updateSubmission(active.id, payload)
        : createSubmission({ contractId: contract.id, ...payload });
    },
    onSuccess: () => after("Draft saved."),
    onError: fail("Could not save the draft."),
  });

  const send = useMutation({
    mutationFn: () => submitSubmission(active!.id),
    onSuccess: () => after("Delivery submitted for review."),
    onError: fail("Could not submit the delivery."),
  });

  const approve = useMutation({
    mutationFn: () => approveSubmission(latest!.id),
    onSuccess: () => {
      invalidateFor(queryClient, "approve", [
        qk.contract(contract.id),
        qk.submissionsForContract(contract.id),
        qk.payment(contract.id),
      ]);
      setReviewOpen(null);
      toast.success("Delivery approved. The payout is on its way to the creator.");
    },
    onError: fail("Could not approve the delivery."),
  });

  const reject = useMutation({
    mutationFn: () => rejectSubmission(latest!.id, reviewNote.trim()),
    onSuccess: () => {
      setReviewOpen(null);
      setReviewNote("");
      after("Delivery rejected.");
    },
    onError: fail("Could not reject the delivery."),
  });

  const revise = useMutation({
    mutationFn: () => requestRevision(latest!.id, reviewNote.trim()),
    onSuccess: () => {
      setReviewOpen(null);
      setReviewNote("");
      after("Revision requested.");
    },
    onError: fail("Could not request a revision."),
  });

  if (contract.status === "PENDING_FUNDING") return null;

  if (submissions.isPending) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </CardBody>
      </Card>
    );
  }

  const editable =
    isCreator && (!active || active.status === "DRAFT" || active.status === "REVISION_REQUESTED");
  // Mirrors the backend rule so nobody submits into a guaranteed 422.
  const hasProof =
    draft.files.length + draft.links.length > 0 ||
    (active ? active.files.length + active.links.length > 0 : false);

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-bone text-[13px] font-medium">Delivery</h2>
            {latest ? (
              <div className="flex items-center gap-1.5">
                <Badge tone={SUBMISSION_STATUS[latest.status].tone}>
                  {SUBMISSION_STATUS[latest.status].label}
                </Badge>
                {latest.revision > 0 ? (
                  <Badge tone="muted">Revision {latest.revision}</Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── Existing proof ── */}
          {latest && latest.status !== "DRAFT" ? (
            <ProofDisplay submission={latest} />
          ) : null}

          {/* ── Creator: build or edit ── */}
          {editable ? (
            <>
              {active?.status === "REVISION_REQUESTED" ? (
                <p className="text-muted text-xs leading-relaxed">
                  The brand asked for changes. Update the proof and submit it again.
                </p>
              ) : null}
              <ProofForm draft={draft} onChange={setDraft} disabled={save.isPending} />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={save.isPending}
                  disabled={draft.files.length + draft.links.length === 0 && !draft.note.trim()}
                  onClick={() => save.mutate()}
                >
                  Save draft
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  loading={send.isPending}
                  disabled={!active || !hasProof}
                  onClick={() => send.mutate()}
                >
                  <Send />
                  Submit for review
                </Button>
                {!hasProof ? (
                  <p className="text-muted w-full text-[11px]">
                    Add at least one link or file before submitting.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {/* ── Creator: waiting ── */}
          {isCreator && active?.status === "SUBMITTED" ? (
            <p className="text-muted text-xs leading-relaxed">
              Submitted and waiting on the brand. You will be notified as soon as they review
              it, and the payout follows approval automatically.
            </p>
          ) : null}

          {/* ── Brand: review ── */}
          {!isCreator && latest?.status === "SUBMITTED" ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="gold" size="sm" onClick={() => setReviewOpen("approve")}>
                <Check />
                Approve and pay
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setReviewOpen("revision")}>
                <Undo2 />
                Request changes
              </Button>
              <Button variant="danger" size="sm" onClick={() => setReviewOpen("reject")}>
                <X />
                Reject
              </Button>
            </div>
          ) : null}

          {!isCreator && !latest ? (
            <p className="text-muted text-xs leading-relaxed">
              Nothing delivered yet. The creator will submit proof here, and you will be
              notified when they do.
            </p>
          ) : null}

          {latest?.status === "APPROVED" ? (
            <p className="text-positive flex items-center gap-2 text-xs">
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Delivery accepted.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* ── Approve: an irreversible money action, so it gets a confirmation ── */}
      <Dialog open={reviewOpen === "approve"} onOpenChange={(o) => !o && setReviewOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this delivery</DialogTitle>
            <DialogDescription>
              This releases the escrowed money to the creator. It cannot be undone, and the
              contract can no longer be refunded afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="border-line bg-emerald-lo flex items-baseline justify-between rounded-xl border px-4 py-3">
            <span className="text-bone-2 text-[13px]">Creator receives</span>
            <Amount
              minor={contract.agreedPrice}
              currency={contract.currency}
              variant="display"
              className="text-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="quiet" size="sm" onClick={() => setReviewOpen(null)}>
              Not yet
            </Button>
            <Button
              variant="gold"
              size="sm"
              loading={approve.isPending}
              onClick={() => approve.mutate()}
            >
              Approve and pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject / request changes: the backend requires a note ── */}
      <Dialog
        open={reviewOpen === "reject" || reviewOpen === "revision"}
        onOpenChange={(o) => !o && setReviewOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewOpen === "reject" ? "Reject this delivery" : "Request changes"}
            </DialogTitle>
            <DialogDescription>
              {reviewOpen === "reject"
                ? "This is final for this delivery. Escrow stays funded, so you can still refund the contract."
                : "The creator can revise and resubmit. Escrow stays where it is."}
            </DialogDescription>
          </DialogHeader>
          <Field
            label="What needs to change?"
            htmlFor="review-note"
            hint="Required. The creator sees this."
            required
          >
            <Textarea
              id="review-note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Be specific about what would make this acceptable."
            />
          </Field>
          <DialogFooter>
            <Button variant="quiet" size="sm" onClick={() => setReviewOpen(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewOpen === "reject" ? "danger" : "gold"}
              size="sm"
              disabled={!reviewNote.trim()}
              loading={reject.isPending || revise.isPending}
              onClick={() => (reviewOpen === "reject" ? reject.mutate() : revise.mutate())}
            >
              {reviewOpen === "reject" ? "Reject delivery" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
