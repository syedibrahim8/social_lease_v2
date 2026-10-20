"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, fieldControlProps } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  REQUIRED_EVIDENCE,
  submitVerification,
  type VerificationEvidence,
  type VerificationType,
} from "@/lib/api/endpoints/verifications";
import { VERIFICATION_TYPE_LABEL } from "@/lib/config/labels";
import { invalidateFor } from "@/lib/query";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const PROFILE_URL_COPY: Partial<Record<VerificationType, { label: string; hint: string }>> = {
  SOCIAL_PROFILE: { label: "Profile link", hint: "The channel you want verified." },
  PROFILE_OWNERSHIP: {
    label: "Profile link",
    hint: "We may ask you to post a code here to prove it's yours.",
  },
  WEBSITE: { label: "Website", hint: "Your company's main site." },
};

/**
 * Asks only for the evidence this type needs. The backend refuses a request
 * missing it, so the form shows exactly those fields and checks them first.
 */
export function SubmitVerificationDialog({
  type,
  open,
  onOpenChange,
}: {
  type: VerificationType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const needs = REQUIRED_EVIDENCE[type];
  const [profileUrl, setProfileUrl] = useState("");
  const [handle, setHandle] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [documents, setDocuments] = useState<string[]>([""]);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: (evidence: VerificationEvidence) =>
      submitVerification({ verificationType: type, evidence }),
    onSuccess: () => {
      invalidateFor(queryClient, "verification");
      onOpenChange(false);
      toast.success("Sent for review. We'll notify you when it's decided.");
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        const found: Record<string, string> = {};
        for (const err of e.errors) {
          if (err.field) found[err.field.replace(/^evidence\./, "")] = err.message;
        }
        if (Object.keys(found).length > 0) {
          setErrors(found);
          return;
        }
      }
      toast.error(e instanceof ApiError ? e.message : "Could not send the request.");
    },
  });

  const send = () => {
    const next: Record<string, string> = {};
    const evidence: VerificationEvidence = {};
    if (needs === "profileUrl") {
      if (!isHttpUrl(profileUrl.trim())) next.profileUrl = "Enter a full URL, including https://";
      else evidence.profileUrl = profileUrl.trim();
    }
    if (needs === "businessEmail") {
      if (!/^\S+@\S+\.\S+$/.test(businessEmail.trim())) next.businessEmail = "Enter an email address";
      else evidence.businessEmail = businessEmail.trim();
    }
    const docs = documents.map((d) => d.trim()).filter(Boolean);
    if (needs === "documents" && docs.length === 0) next.documents = "Add at least one document link";
    if (docs.some((d) => !isHttpUrl(d))) next.documents = "Each document must be a full URL";
    if (docs.length > 0) evidence.documents = docs.slice(0, 10);
    if (handle.trim()) evidence.handle = handle.trim();
    if (note.trim()) evidence.note = note.trim();
    setErrors(next);
    if (Object.keys(next).length === 0) submit.mutate(evidence);
  };

  const copy = PROFILE_URL_COPY[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verify: {VERIFICATION_TYPE_LABEL[type].label}</DialogTitle>
          <DialogDescription>{VERIFICATION_TYPE_LABEL[type].description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {needs === "profileUrl" && copy ? (
            <Field label={copy.label} htmlFor="v-url" required hint={copy.hint} error={errors.profileUrl}>
              <Input
                {...fieldControlProps("v-url", errors.profileUrl, copy.hint)}
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                inputMode="url"
                placeholder="https://"
              />
            </Field>
          ) : null}
          {type === "SOCIAL_PROFILE" || type === "PROFILE_OWNERSHIP" ? (
            <Field label="Handle" htmlFor="v-handle" error={errors.handle}>
              <Input
                {...fieldControlProps("v-handle", errors.handle)}
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                maxLength={120}
                placeholder="@yourname"
              />
            </Field>
          ) : null}
          {needs === "businessEmail" ? (
            <Field label="Business email" htmlFor="v-email" required error={errors.businessEmail}>
              <Input
                {...fieldControlProps("v-email", errors.businessEmail)}
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </Field>
          ) : null}
          {needs === "documents" || type === "COMPANY" || type === "IDENTITY" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-bone-2 text-xs font-medium">
                  Documents{needs === "documents" ? <span className="text-gold ml-1">*</span> : null}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={documents.length >= 10}
                  onClick={() => setDocuments((d) => [...d, ""])}
                >
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </div>
              <p className="text-muted text-[11px]">
                Links to the files, e.g. a shared drive. Only reviewers can see them.
              </p>
              {documents.map((doc, i) => (
                <div key={i} className="flex gap-2">
                  <label htmlFor={`v-doc-${i}`} className="sr-only">
                    Document {i + 1}
                  </label>
                  <Input
                    id={`v-doc-${i}`}
                    value={doc}
                    onChange={(e) =>
                      setDocuments((d) => d.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    inputMode="url"
                    placeholder="https://"
                    aria-invalid={errors.documents ? true : undefined}
                  />
                  {documents.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove document ${i + 1}`}
                      onClick={() => setDocuments((d) => d.filter((_, j) => j !== i))}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {errors.documents ? (
                <p role="alert" className="text-negative text-[11px]">
                  {errors.documents}
                </p>
              ) : null}
            </div>
          ) : null}
          <Field label="Note for the reviewer" htmlFor="v-note">
            <Textarea id="v-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" size="sm" loading={submit.isPending} onClick={send}>
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
