"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Reply, Undo2, X } from "lucide-react";
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
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import type { Negotiation } from "@/lib/api/mock/negotiations";
import type { Role } from "@/lib/api/types";

const counterSchema = z.object({
  amount: z.number({ message: "Enter an amount" }).positive("Must be greater than 0"),
  message: z.string().optional(),
});
type CounterValues = z.infer<typeof counterSchema>;

function CounterDialog({
  currentAmount,
  currency,
  onCounter,
}: {
  currentAmount: number;
  currency: string;
  onCounter: (amount: number, message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CounterValues>({
    resolver: zodResolver(counterSchema),
    defaultValues: { amount: currentAmount / 100, message: "" },
  });

  const submit = (v: CounterValues) => {
    onCounter(Math.round(v.amount * 100), v.message ?? "");
    reset({ amount: v.amount, message: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Reply />
          Counter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Counter offer</DialogTitle>
          <DialogDescription>
            Propose a new amount and an optional note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Field label={`Amount (${currency})`} htmlFor="amount" error={errors.amount?.message}>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              {...register("amount", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Message" htmlFor="message">
            <Textarea id="message" placeholder="Add a note…" {...register("message")} />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="brand">
              Send counter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface NegotiationActionsProps {
  negotiation: Negotiation;
  role: Role;
  onAccept: () => void;
  onReject: () => void;
  onWithdraw: () => void;
  onCounter: (amount: number, message: string) => void;
}

export function NegotiationActions({
  negotiation,
  role,
  onAccept,
  onReject,
  onWithdraw,
  onCounter,
}: NegotiationActionsProps) {
  const active =
    negotiation.status === "PENDING" || negotiation.status === "NEGOTIATING";
  const latest = negotiation.offers[negotiation.offers.length - 1];
  const pending = latest && latest.status === "PENDING" ? latest : null;
  const myTurn =
    !!pending && pending.sender !== role && (role === "CREATOR" || role === "BRAND");
  const isCreator = role === "CREATOR";
  const counterparty =
    role === "BRAND" ? negotiation.creatorName : negotiation.brandName;

  if (!active) {
    const agreed = negotiation.offers.find((o) => o.status === "ACCEPTED")?.amount;
    const map = {
      ACCEPTED: {
        cls: "border-success/30 bg-success-muted text-success-text",
        text: agreed
          ? `Agreement reached at ${formatMoney(agreed, negotiation.currency)}. A contract has been created.`
          : "Agreement reached.",
      },
      REJECTED: {
        cls: "border-danger/30 bg-danger-muted text-danger-text",
        text: "This application was rejected.",
      },
      WITHDRAWN: {
        cls: "border-border bg-muted text-muted-foreground",
        text: "This application was withdrawn.",
      },
    } as const;
    const m = map[negotiation.status as keyof typeof map] ?? map.WITHDRAWN;
    return (
      <div className={`rounded-xl border p-4 text-sm font-medium ${m.cls}`}>
        {m.text}
      </div>
    );
  }

  return (
    <Card className="gap-4 p-5">
      {myTurn && pending ? (
        <>
          <p className="text-sm">
            <span className="font-medium">{counterparty}</span> offered{" "}
            <span className="tabular font-semibold">
              {formatMoney(pending.amount, negotiation.currency)}
            </span>{" "}
            — your move.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="brand" onClick={onAccept}>
              <Check />
              Accept {formatMoney(pending.amount, negotiation.currency)}
            </Button>
            <CounterDialog
              currentAmount={pending.amount}
              currency={negotiation.currency}
              onCounter={onCounter}
            />
            <Button variant="destructive" onClick={onReject}>
              <X />
              Reject
            </Button>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Waiting for {counterparty} to respond to your offer…
        </p>
      )}
      {isCreator ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={onWithdraw}
        >
          <Undo2 />
          Withdraw application
        </Button>
      ) : null}
    </Card>
  );
}
