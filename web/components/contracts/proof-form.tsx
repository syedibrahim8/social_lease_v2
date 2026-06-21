"use client";

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROOF_TYPES } from "@/lib/config/contracts";
import type { ProofItem } from "@/lib/api/mock/contracts";

const schema = z.object({
  items: z
    .array(
      z.object({
        type: z.enum(["SCREENSHOT", "ANALYTICS_SCREENSHOT", "DOCUMENT", "LINK"]),
        url: z.string().url("Enter a valid URL"),
        caption: z.string().optional(),
      }),
    )
    .min(1, "Add at least one piece of proof"),
  note: z.string().optional(),
});
type ProofValues = z.infer<typeof schema>;

interface ProofFormProps {
  defaultProof?: ProofItem[];
  defaultNote?: string;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (proof: ProofItem[], note?: string) => void;
}

export function ProofForm({
  defaultProof,
  defaultNote,
  submitLabel,
  loading,
  onSubmit,
}: ProofFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProofValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      items:
        defaultProof && defaultProof.length > 0
          ? defaultProof.map((p) => ({
              type: p.type,
              url: p.url,
              caption: p.caption ?? "",
            }))
          : [{ type: "LINK", url: "", caption: "" }],
      note: defaultNote ?? "",
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const submit = (v: ProofValues) =>
    onSubmit(
      v.items.map((it, i) => ({
        id: `p${i + 1}`,
        type: it.type,
        url: it.url,
        caption: it.caption || undefined,
      })),
      v.note || undefined,
    );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={f.id} className="border-border space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">
                Proof {i + 1}
              </span>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(i)}
                  aria-label="Remove proof"
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Controller
                control={control}
                name={`items.${i}.type`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROOF_TYPES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Field error={errors.items?.[i]?.url?.message}>
                <Input placeholder="https://…" {...register(`items.${i}.url`)} />
              </Field>
            </div>
            <Input
              placeholder="Caption (optional)"
              {...register(`items.${i}.caption`)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ type: "LINK", url: "", caption: "" })}
        >
          <Plus />
          Add proof
        </Button>
      </div>

      <Field label="Note (optional)" htmlFor="note">
        <Textarea
          id="note"
          placeholder="Anything the brand should know…"
          {...register("note")}
        />
      </Field>

      <Button type="submit" variant="brand" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
