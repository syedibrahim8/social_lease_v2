"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EVIDENCE_FIELDS,
  VERIFICATION_TYPES,
  verificationTypeLabel,
  verificationTypesForRole,
  type EvidenceField,
} from "@/lib/config/verification";
import type { VerificationEvidence } from "@/lib/api/mock/verifications";
import type { Role } from "@/lib/api/types";

const schema = z
  .object({
    verificationType: z.string().min(1, "Select a type"),
    profileUrl: z.string().optional(),
    handle: z.string().optional(),
    businessEmail: z.string().optional(),
    website: z.string().optional(),
    documents: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const meta = VERIFICATION_TYPES[val.verificationType];
    if (!meta) return;
    for (const field of meta.evidence) {
      const value = val[field];
      if (!value || !value.trim()) {
        ctx.addIssue({ path: [field], code: "custom", message: "Required" });
        continue;
      }
      if (
        (field === "profileUrl" || field === "website" || field === "documents") &&
        !/^https?:\/\//.test(value)
      ) {
        ctx.addIssue({ path: [field], code: "custom", message: "Enter a valid URL" });
      }
      if (field === "businessEmail" && !/^\S+@\S+\.\S+$/.test(value)) {
        ctx.addIssue({ path: [field], code: "custom", message: "Enter a valid email" });
      }
    }
  });
type VerificationValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onSubmit: (type: string, evidence: VerificationEvidence) => void;
}

export function VerificationRequestDialog({ open, onOpenChange, role, onSubmit }: Props) {
  const types = verificationTypesForRole(role);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VerificationValues>({
    resolver: zodResolver(schema),
    defaultValues: { verificationType: "" },
  });

  const selectedType = useWatch({ control, name: "verificationType" });
  const meta = selectedType ? VERIFICATION_TYPES[selectedType] : undefined;

  const submit = (val: VerificationValues) => {
    const evidence: VerificationEvidence = {};
    if (val.profileUrl) evidence.profileUrl = val.profileUrl;
    if (val.handle) evidence.handle = val.handle;
    if (val.businessEmail) evidence.businessEmail = val.businessEmail;
    if (val.website) evidence.website = val.website;
    if (val.documents) evidence.documents = [val.documents];
    if (val.note) evidence.note = val.note;
    onSubmit(val.verificationType, evidence);
    reset({ verificationType: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request verification</DialogTitle>
          <DialogDescription>
            Pick a verification type and provide the required evidence.
          </DialogDescription>
        </DialogHeader>

        {types.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No verification types are available for this role.
          </p>
        ) : (
          <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
            <Field label="Type" htmlFor="verificationType" error={errors.verificationType?.message}>
              <Controller
                control={control}
                name="verificationType"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="verificationType">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {verificationTypeLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {meta ? (
              <>
                <p className="text-muted-foreground text-xs">{meta.description}</p>
                {meta.evidence.map((fieldKey: EvidenceField) => {
                  const f = EVIDENCE_FIELDS[fieldKey];
                  return (
                    <Field
                      key={fieldKey}
                      label={f.label}
                      htmlFor={fieldKey}
                      error={errors[fieldKey]?.message}
                    >
                      {f.kind === "textarea" ? (
                        <Textarea id={fieldKey} placeholder={f.placeholder} {...register(fieldKey)} />
                      ) : (
                        <Input
                          id={fieldKey}
                          type={f.kind === "email" ? "email" : "text"}
                          placeholder={f.placeholder}
                          {...register(fieldKey)}
                        />
                      )}
                    </Field>
                  );
                })}
              </>
            ) : null}

            <DialogFooter>
              <Button type="submit" variant="brand" disabled={!meta}>
                Submit request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
