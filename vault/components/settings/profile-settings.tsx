"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ApiError } from "@/lib/api/client";
import {
  COMPANY_SIZES,
  getMyBrandProfile,
  getMyCreatorProfile,
  updateMyBrandProfile,
  updateMyCreatorProfile,
  type BrandProfile,
  type CompanySize,
  type CreatorProfile,
} from "@/lib/api/endpoints/profiles";
import { invalidateFor, qk } from "@/lib/query";
import type { VerificationState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const VERIFICATION_TONE: Record<VerificationState, "positive" | "warning" | "negative" | "muted"> =
  {
    VERIFIED: "positive",
    PENDING: "warning",
    REJECTED: "negative",
    UNVERIFIED: "muted",
  };

/**
 * Verification fields are read-only here on purpose.
 *
 * The backend rejects them from update bodies via `.strict()` — only an admin
 * review can set them. Rendering them as editable inputs would invite someone
 * to try, and the server would refuse. Shown as status with an explanation
 * instead.
 */
function VerificationRow({ label, state }: { label: string; state: VerificationState }) {
  return (
    <div className="border-line-2 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-bone-2 text-[13px]">{label}</p>
        <p className="text-muted mt-0.5 text-[11px]">Set by review. You cannot change this.</p>
      </div>
      <Badge tone={VERIFICATION_TONE[state]}>
        {state === "VERIFIED" ? <ShieldCheck aria-hidden="true" /> : null}
        {state.charAt(0) + state.slice(1).toLowerCase()}
      </Badge>
    </div>
  );
}

/**
 * What the server will actually accept per field, mirrored from the Zod schemas
 * in `creator.validators.ts` / `brand.validators.ts`.
 *
 * This matters more than it looks. The obvious implementation — strip empty
 * values and send the rest — makes the form lie: emptying your bio would appear
 * to save and then come back on the next load, because the key was never sent.
 * So each field declares whether an empty value is a legal way to clear it:
 *
 *  - `text`     is `z.string().trim().max(n).optional()`; "" is valid, so
 *               clearing genuinely works.
 *  - `required` carries `min(2)`; "" is rejected, so the save is blocked with a
 *               field error rather than silently dropped.
 *  - `url`      is `z.string().url()`; "" is rejected, so a website can be
 *               replaced but not removed through this endpoint. Say so.
 */
type FieldKind = "text" | "required" | "url";

const CREATOR_FIELDS: Record<string, FieldKind> = {
  displayName: "required",
  niche: "text",
  location: "text",
  bio: "text",
};

const BRAND_FIELDS: Record<string, FieldKind> = {
  companyName: "required",
  website: "url",
  industry: "text",
  description: "text",
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ProfileSettings({ isCreator }: { isCreator: boolean }) {
  const queryClient = useQueryClient();

  const creator = useQuery({
    queryKey: qk.creatorProfile(),
    queryFn: getMyCreatorProfile,
    enabled: isCreator,
    retry: false,
  });
  const brand = useQuery({
    queryKey: qk.brandProfile(),
    queryFn: getMyBrandProfile,
    enabled: !isCreator,
    retry: false,
  });

  const query = isCreator ? creator : brand;

  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Same reasoning as the delivery editor: hydrate from the loaded profile
  // during render rather than in an effect, so the inputs never paint empty.
  const profile = query.data;
  if (profile && hydratedFor !== profile.id) {
    setHydratedFor(profile.id);
    setErrors({});
    setForm(
      isCreator
        ? {
            displayName: (profile as CreatorProfile).displayName,
            bio: (profile as CreatorProfile).bio ?? "",
            niche: (profile as CreatorProfile).niche ?? "",
            location: (profile as CreatorProfile).location ?? "",
          }
        : {
            companyName: (profile as BrandProfile).companyName,
            website: (profile as BrandProfile).website ?? "",
            industry: (profile as BrandProfile).industry ?? "",
            companySize: (profile as BrandProfile).companySize ?? "",
            description: (profile as BrandProfile).description ?? "",
          },
    );
  }

  // The two profile shapes are a union here, so the mutation types are stated
  // explicitly rather than inferred from a branching return.
  const save = useMutation<CreatorProfile | BrandProfile, unknown, Record<string, string>>({
    mutationFn: (payload) =>
      isCreator
        ? updateMyCreatorProfile(payload)
        : updateMyBrandProfile(payload as { companySize?: CompanySize }),
    onSuccess: () => {
      invalidateFor(queryClient, "profile");
      toast.success("Profile saved.");
    },
    onError: (e: unknown) => {
      // A field-level rejection belongs on the field, not in a toast.
      if (e instanceof ApiError) {
        const spec = isCreator ? CREATOR_FIELDS : BRAND_FIELDS;
        const found: Record<string, string> = {};
        for (const key of Object.keys(spec)) {
          const message = e.fieldError(key);
          if (message) found[key] = message;
        }
        if (Object.keys(found).length > 0) {
          setErrors(found);
          return;
        }
      }
      toast.error(e instanceof ApiError ? e.message : "Could not save your profile.");
    },
  });

  if (query.isPending) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardBody>
      </Card>
    );
  }

  // A 404 here is a real state, not a failure: the profile has not been created.
  if (query.isError || !profile) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <EmptyState
        icon={UserRoundX}
        title={notFound ? "You have no profile yet" : "Could not load your profile"}
        description={
          notFound
            ? isCreator
              ? "Creating a creator profile is part of onboarding and is not built into Vault yet. The original app can create one."
              : "Creating a company profile is part of onboarding and is not built into Vault yet. The original app can create one."
            : query.error instanceof Error
              ? query.error.message
              : "Please try again."
        }
      />
    );
  }

  const set = (key: string) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = () => {
    const spec = isCreator ? CREATOR_FIELDS : BRAND_FIELDS;
    const payload: Record<string, string> = {};
    const nextErrors: Record<string, string> = {};

    for (const [key, kind] of Object.entries(spec)) {
      const value = (form[key] ?? "").trim();

      if (kind === "required") {
        if (value.length < 2) {
          nextErrors[key] = "At least 2 characters.";
          continue;
        }
        payload[key] = value;
      } else if (kind === "url") {
        if (value === "") {
          const existing = (profile as BrandProfile).website;
          if (existing) nextErrors[key] = "A saved website can be changed here, but not removed.";
          continue;
        }
        if (!isHttpUrl(value)) {
          nextErrors[key] = "Enter a full URL, including https://";
          continue;
        }
        payload[key] = value;
      } else {
        // "" is accepted by the server, so an emptied field really is cleared.
        payload[key] = value;
      }
    }

    // Selectable, never unselectable: the enum has no empty member.
    if (!isCreator && form.companySize) payload.companySize = form.companySize;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    save.mutate(payload);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {isCreator ? (
            <>
              <Field
                label="Display name"
                htmlFor="displayName"
                required
                error={errors.displayName}
                className="sm:col-span-2"
              >
                <Input
                  id="displayName"
                  value={form.displayName ?? ""}
                  onChange={(e) => set("displayName")(e.target.value)}
                />
              </Field>
              <Field label="Niche" htmlFor="niche" error={errors.niche}>
                <Input
                  id="niche"
                  value={form.niche ?? ""}
                  onChange={(e) => set("niche")(e.target.value)}
                  placeholder="Beauty, fitness, tech…"
                />
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location}>
                <Input
                  id="location"
                  value={form.location ?? ""}
                  onChange={(e) => set("location")(e.target.value)}
                  placeholder="Lagos, Nigeria"
                />
              </Field>
              <Field label="Bio" htmlFor="bio" error={errors.bio} className="sm:col-span-2">
                <Textarea
                  id="bio"
                  value={form.bio ?? ""}
                  onChange={(e) => set("bio")(e.target.value)}
                  placeholder="What you make, and who for."
                />
              </Field>
            </>
          ) : (
            <>
              <Field
                label="Company name"
                htmlFor="companyName"
                required
                error={errors.companyName}
                className="sm:col-span-2"
              >
                <Input
                  id="companyName"
                  value={form.companyName ?? ""}
                  onChange={(e) => set("companyName")(e.target.value)}
                />
              </Field>
              <Field
                label="Website"
                htmlFor="website"
                hint="Include https://"
                error={errors.website}
              >
                <Input
                  id="website"
                  value={form.website ?? ""}
                  onChange={(e) => set("website")(e.target.value)}
                  placeholder="https://example.com"
                />
              </Field>
              <Field label="Industry" htmlFor="industry" error={errors.industry}>
                <Input
                  id="industry"
                  value={form.industry ?? ""}
                  onChange={(e) => set("industry")(e.target.value)}
                  placeholder="Retail, SaaS, hospitality…"
                />
              </Field>
              <Field label="Company size" htmlFor="companySize" className="sm:col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {COMPANY_SIZES.map((size) => {
                    const active = form.companySize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        aria-pressed={active}
                        onClick={() => set("companySize")(size)}
                        className={cn(
                          "tnum inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] transition-colors",
                          active
                            ? "border-gold/40 bg-gold/12 text-gold-lo"
                            : "border-line-2 text-muted hover:border-bone/20 hover:text-bone",
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                error={errors.description}
                className="sm:col-span-2"
              >
                <Textarea
                  id="description"
                  value={form.description ?? ""}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="What the company does."
                />
              </Field>
            </>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button variant="gold" size="sm" loading={save.isPending} onClick={submit}>
          Save changes
        </Button>
      </div>

      <Card>
        <CardBody className="space-y-2.5">
          <p className="text-bone text-[13px] font-medium">Verification</p>
          {isCreator ? (
            <>
              <VerificationRow
                label="Profile verification"
                state={(profile as CreatorProfile).verificationStatus}
              />
              <VerificationRow
                label="Profile ownership"
                state={(profile as CreatorProfile).profileOwnershipStatus}
              />
            </>
          ) : (
            <VerificationRow
              label="Company verification"
              state={(profile as BrandProfile).verifiedStatus}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
