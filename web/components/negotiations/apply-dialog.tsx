"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockDelay } from "@/lib/api/adapter";

const applySchema = z.object({
  amount: z.number({ message: "Enter your proposed price" }).positive("Must be greater than 0"),
  message: z.string().min(1, "Add a short pitch"),
});
type ApplyValues = z.infer<typeof applySchema>;

export function ApplyDialog({
  campaignTitle,
  open,
  onOpenChange,
}: {
  campaignTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { message: "" },
  });

  const submit = async () => {
    setLoading(true);
    await mockDelay(500);
    setLoading(false);
    onOpenChange(false);
    reset();
    toast.success("Application sent", {
      description: "Track it in the Negotiation Center.",
      action: { label: "View", onClick: () => router.push("/negotiations") },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to campaign</DialogTitle>
          <DialogDescription>
            Send your proposed price and a short pitch for “{campaignTitle}”.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <Field
            label="Proposed price (USD)"
            htmlFor="amount"
            error={errors.amount?.message}
            hint="This seeds your first offer in the negotiation."
          >
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={0}
              placeholder="1500.00"
              {...register("amount", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Pitch" htmlFor="message" error={errors.message?.message}>
            <Textarea
              id="message"
              placeholder="Why you're a great fit, deliverables, timeline…"
              {...register("message")}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="brand" loading={loading}>
              Send application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
