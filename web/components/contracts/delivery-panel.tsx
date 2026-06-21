"use client";

import { useState, type ReactNode } from "react";
import { Check, Clock, RotateCcw, Undo2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/forms/field";
import { Textarea } from "@/components/ui/textarea";
import { ProofForm } from "./proof-form";
import { ProofDisplay } from "./proof-display";
import { formatMoney, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contract, ProofItem } from "@/lib/api/mock/contracts";
import type { Role } from "@/lib/api/types";

const bannerTones = {
  success: "border-success/30 bg-success-muted text-success-text",
  warning: "border-warning/30 bg-warning-muted text-warning-text",
  danger: "border-danger/30 bg-danger-muted text-danger-text",
  muted: "border-border bg-muted text-muted-foreground",
} as const;

function Banner({
  tone,
  children,
}: {
  tone: keyof typeof bannerTones;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border p-4 text-sm font-medium", bannerTones[tone])}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-4 p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

function Waiting({ children }: { children: ReactNode }) {
  return (
    <Card className="text-muted-foreground flex-row items-center gap-2.5 p-5 text-sm">
      <Clock className="size-4 shrink-0" />
      {children}
    </Card>
  );
}

function ReviewDialog({
  trigger,
  title,
  description,
  requireNote,
  confirmLabel,
  variant,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  requireNote: boolean;
  confirmLabel: string;
  variant: "brand" | "destructive-solid";
  onConfirm: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const submit = () => {
    if (requireNote && !note.trim()) return;
    onConfirm(note.trim());
    setOpen(false);
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Field label={requireNote ? "Feedback" : "Reason (optional)"} htmlFor="review-note">
          <Textarea
            id="review-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share details for the creator…"
          />
        </Field>
        <DialogFooter>
          <Button variant={variant} onClick={submit} disabled={requireNote && !note.trim()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeliveryPanelProps {
  contract: Contract;
  role: Role;
  submitting?: boolean;
  onSubmitDelivery: (proof: ProofItem[], note?: string) => void;
  onApprove: () => void;
  onRequestRevision: (note: string) => void;
  onReject: (note?: string) => void;
  onRefund: (note?: string) => void;
  onFund: () => void;
  onCancel: () => void;
}

export function DeliveryPanel({
  contract,
  role,
  submitting,
  onSubmitDelivery,
  onApprove,
  onRequestRevision,
  onReject,
  onRefund,
  onFund,
  onCancel,
}: DeliveryPanelProps) {
  const { status, submission: sub, brandName, creatorName, currency, agreedPrice } =
    contract;
  const isCreator = role === "CREATOR";
  const isBrand = role === "BRAND";

  if (status === "CANCELLED") {
    return <Banner tone="muted">This contract was cancelled.</Banner>;
  }
  if (status === "DISPUTED") {
    return <Banner tone="danger">This contract is in dispute and under review.</Banner>;
  }

  if (status === "APPROVED" || status === "COMPLETED") {
    return (
      <Section title="Delivery">
        <Banner tone="success">
          Delivery approved — {formatMoney(agreedPrice, currency)} released to {creatorName}.
        </Banner>
        {sub ? <ProofDisplay proof={sub.proof} note={sub.note} /> : null}
      </Section>
    );
  }

  if (status === "PENDING_FUNDING") {
    if (isBrand) {
      return (
        <Section title="Fund this contract">
          <p className="text-muted-foreground text-sm">
            Fund {formatMoney(agreedPrice, currency)} into escrow to start the work
            with {creatorName}. Funds release only when you approve the delivery.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" onClick={onFund}>
              Fund contract
            </Button>
            <ReviewDialog
              trigger={<Button variant="ghost">Cancel contract</Button>}
              title="Cancel contract"
              description="This cancels the contract and the campaign. This cannot be undone."
              requireNote={false}
              confirmLabel="Cancel contract"
              variant="destructive-solid"
              onConfirm={() => onCancel()}
            />
          </div>
        </Section>
      );
    }
    return <Waiting>Waiting for {brandName} to fund this contract.</Waiting>;
  }

  if (status === "SUBMITTED" && sub) {
    if (isBrand) {
      return (
        <Section title="Review delivery">
          <ProofDisplay proof={sub.proof} note={sub.note} />
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" onClick={onApprove}>
              <Check />
              Approve & release {formatMoney(agreedPrice, currency)}
            </Button>
            <ReviewDialog
              trigger={
                <Button variant="outline">
                  <RotateCcw />
                  Request revision
                </Button>
              }
              title="Request a revision"
              description="Tell the creator what to change before you approve."
              requireNote
              confirmLabel="Send request"
              variant="brand"
              onConfirm={onRequestRevision}
            />
            <ReviewDialog
              trigger={
                <Button variant="destructive">
                  <X />
                  Reject
                </Button>
              }
              title="Reject delivery"
              description="This rejects the submitted work."
              requireNote={false}
              confirmLabel="Reject delivery"
              variant="destructive-solid"
              onConfirm={(note) => onReject(note || undefined)}
            />
          </div>
        </Section>
      );
    }
    return (
      <Section title="Delivery under review">
        <Banner tone="warning">
          Submitted {sub.submittedAt ? formatRelative(sub.submittedAt) : "recently"}.
          Awaiting {brandName}&apos;s review.
        </Banner>
        <ProofDisplay proof={sub.proof} note={sub.note} />
      </Section>
    );
  }

  // FUNDED or IN_PROGRESS
  if (isCreator) {
    const revision = sub?.status === "REVISION_REQUESTED";
    const rejected = sub?.status === "REJECTED";
    return (
      <div className="space-y-4">
        {revision && sub?.reviewNote ? (
          <Banner tone="warning">Revision requested: {sub.reviewNote}</Banner>
        ) : null}
        {rejected ? (
          <Banner tone="danger">
            Your previous delivery was rejected. You can submit a new one.
          </Banner>
        ) : null}
        <Section title={revision ? "Resubmit your delivery" : "Submit your delivery"}>
          <ProofForm
            defaultProof={revision ? sub?.proof : undefined}
            defaultNote={revision ? sub?.note : undefined}
            submitLabel={revision ? "Resubmit delivery" : "Submit delivery"}
            loading={submitting}
            onSubmit={onSubmitDelivery}
          />
        </Section>
      </div>
    );
  }

  const revision = sub?.status === "REVISION_REQUESTED";
  return (
    <Card className="gap-4 p-5">
      <p className="text-muted-foreground inline-flex items-center gap-2.5 text-sm">
        <Clock className="size-4 shrink-0" />
        {revision
          ? `Revision requested — waiting for ${creatorName} to resubmit.`
          : `Waiting for ${creatorName} to submit their delivery.`}
      </p>
      <ReviewDialog
        trigger={
          <Button variant="outline" size="sm" className="w-fit">
            <Undo2 />
            Refund {formatMoney(agreedPrice, currency)}
          </Button>
        }
        title="Refund this contract"
        description="Refunds the escrowed funds to you and cancels the contract. This cannot be undone."
        requireNote={false}
        confirmLabel="Issue refund"
        variant="destructive-solid"
        onConfirm={(note) => onRefund(note || undefined)}
      />
    </Card>
  );
}
