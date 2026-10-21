"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, UserRoundCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, fieldControlProps } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ChoicePills } from "@/components/ui/choice-pills";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  COMPANY_SIZES,
  SOCIAL_NETWORKS,
  createBrandProfile,
  createCreatorProfile,
} from "@/lib/api/endpoints/profiles";
import { useAuth } from "@/lib/auth/auth-provider";
import { useMyProfile } from "@/lib/auth/use-profile";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { SOCIAL_NETWORK_LABEL } from "@/lib/config/labels";
import { invalidateFor } from "@/lib/query";
import {
  EMPTY_SOCIALS,
  brandPayload,
  brandProfileSchema,
  creatorPayload,
  creatorProfileSchema,
  type BrandProfileValues,
  type CreatorProfileValues,
} from "@/lib/validations/profile";
import { cn } from "@/lib/utils";

/**
 * First-run profile setup.
 *
 * Until this exists the backend refuses the rest of the product: a creator
 * can't apply and a brand can't post. Two short steps rather than one long
 * form — the required part comes first, so the second step can be skipped.
 */
export default function OnboardingPage() {
  const { role } = useAuth();
  const profile = useMyProfile();
  const router = useRouter();

  if (!profile.applies) {
    return (
      <EmptyState
        icon={UserRoundCheck}
        title="No profile needed"
        description="Administrator accounts don't have a public profile."
      />
    );
  }

  if (profile.isPending) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (!profile.missing) {
    return (
      <EmptyState
        icon={UserRoundCheck}
        title="Your profile is set up"
        description="You can change it at any time from settings."
        action={
          <Button size="sm" variant="ghost" onClick={() => router.push("/settings")}>
            Open settings
          </Button>
        }
      />
    );
  }

  return role === "CREATOR" ? <CreatorOnboarding /> : <BrandOnboarding />;
}

function Steps({ step, labels }: { step: number; labels: [string, string] }) {
  return (
    <ol className="mb-5 flex items-center gap-3" aria-label="Progress">
      {labels.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            <span
              className={cn(
                "tnum grid size-6 place-items-center rounded-full border text-[11px]",
                current && "border-gold/50 bg-gold/12 text-gold-lo",
                done && "border-positive/40 bg-positive/10 text-positive",
                !current && !done && "border-line-2 text-muted",
              )}
            >
              {done ? <Check className="size-3" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("text-[12px]", current ? "text-bone" : "text-muted")}>{label}</span>
            {i === 0 ? <span className="bg-line-2 h-px w-8" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function useFinish() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return {
    done: () => {
      invalidateFor(queryClient, "profile");
      toast.success("Profile created. You're ready to go.");
      router.replace("/dashboard");
    },
    exists: () => {
      invalidateFor(queryClient, "profile");
      toast.info("You already have a profile.");
      router.replace("/settings");
    },
  };
}

/* ── Creator ─────────────────────────────────────────────────────────────── */

const CREATOR_STEP_ONE: FieldPath<CreatorProfileValues>[] = ["displayName", "niche", "location", "bio"];

function CreatorOnboarding() {
  const [step, setStep] = useState(0);
  const finish = useFinish();
  const {
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatorProfileValues>({
    resolver: zodResolver(creatorProfileSchema),
    defaultValues: {
      displayName: "",
      niche: "",
      location: "",
      bio: "",
      socials: EMPTY_SOCIALS,
      followers: "",
      engagementRate: "",
      averageReach: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCreatorProfile(creatorPayload(values));
      finish.done();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return finish.exists();
      applyServerErrors(error, setError, "Could not create your profile.");
      // A server rule on a step-one field: take them back to it.
      if (error instanceof ApiError && error.errors.some((e) => CREATOR_STEP_ONE.includes(e.field as never))) {
        setStep(0);
      }
    }
  });

  return (
    <>
      <PageHeader
        title="Set up your creator profile"
        description="Brands see this when you apply. You can change any of it later."
      />
      <Steps step={step} labels={["About you", "Your audience"]} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {step === 0 ? (
          <Card>
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Display name"
                htmlFor="displayName"
                required
                error={errors.displayName?.message}
                className="sm:col-span-2"
              >
                <Input
                  {...fieldControlProps("displayName", errors.displayName?.message)}
                  {...register("displayName")}
                  autoFocus
                />
              </Field>
              <Field label="Niche" htmlFor="niche" error={errors.niche?.message} hint="What brands search for.">
                <Input
                  {...fieldControlProps("niche", errors.niche?.message, "What brands search for.")}
                  {...register("niche")}
                  placeholder="Beauty, fitness, tech…"
                />
              </Field>
              <Field label="Location" htmlFor="location" error={errors.location?.message}>
                <Input
                  {...fieldControlProps("location", errors.location?.message)}
                  {...register("location")}
                  placeholder="Lagos, Nigeria"
                />
              </Field>
              <Field label="Bio" htmlFor="bio" error={errors.bio?.message} className="sm:col-span-2">
                <Textarea
                  {...fieldControlProps("bio", errors.bio?.message)}
                  {...register("bio")}
                  placeholder="What you make, and who for."
                />
              </Field>
            </CardBody>
          </Card>
        ) : (
          <>
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-bone text-[13px] font-medium">Audience</p>
                  <p className="text-muted mt-0.5 text-[12px]">
                    Used to rank you in brand searches and to suggest prices. Leave blank if unsure.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Followers" htmlFor="followers" error={errors.followers?.message}>
                    <Input
                      {...fieldControlProps("followers", errors.followers?.message)}
                      {...register("followers")}
                      inputMode="numeric"
                      placeholder="48,000"
                      className="tnum"
                    />
                  </Field>
                  <Field
                    label="Engagement rate (%)"
                    htmlFor="engagementRate"
                    error={errors.engagementRate?.message}
                  >
                    <Input
                      {...fieldControlProps("engagementRate", errors.engagementRate?.message)}
                      {...register("engagementRate")}
                      inputMode="decimal"
                      placeholder="3.4"
                      className="tnum"
                    />
                  </Field>
                  <Field label="Average reach" htmlFor="averageReach" error={errors.averageReach?.message}>
                    <Input
                      {...fieldControlProps("averageReach", errors.averageReach?.message)}
                      {...register("averageReach")}
                      inputMode="numeric"
                      placeholder="20,000"
                      className="tnum"
                    />
                  </Field>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-bone text-[13px] font-medium">Your channels</p>
                  <p className="text-muted mt-0.5 text-[12px]">
                    Links to the profiles you&apos;ll post on. Add the ones you use.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {SOCIAL_NETWORKS.map((network) => {
                    const message = errors.socials?.[network]?.message;
                    const id = `social-${network}`;
                    return (
                      <Field key={network} label={SOCIAL_NETWORK_LABEL[network]} htmlFor={id} error={message}>
                        <Input
                          {...fieldControlProps(id, message)}
                          {...register(`socials.${network}`)}
                          inputMode="url"
                          placeholder="https://"
                        />
                      </Field>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </>
        )}

        <div className="flex items-center justify-between gap-3">
          {step === 1 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step === 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (await trigger(CREATOR_STEP_ONE)) setStep(1);
              }}
            >
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" variant="gold" size="sm" loading={isSubmitting}>
              Create profile
            </Button>
          )}
        </div>
      </form>
    </>
  );
}

/* ── Brand ───────────────────────────────────────────────────────────────── */

const BRAND_STEP_ONE: FieldPath<BrandProfileValues>[] = ["companyName", "website", "industry"];

function BrandOnboarding() {
  const [step, setStep] = useState(0);
  const finish = useFinish();
  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BrandProfileValues>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      companyName: "",
      website: "",
      logo: "",
      industry: "",
      companySize: "",
      description: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createBrandProfile(brandPayload(values));
      finish.done();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) return finish.exists();
      applyServerErrors(error, setError, "Could not create your company profile.");
      if (error instanceof ApiError && error.errors.some((e) => BRAND_STEP_ONE.includes(e.field as never))) {
        setStep(0);
      }
    }
  });

  return (
    <>
      <PageHeader
        title="Set up your company"
        description="Creators see this on every campaign you post. You can change it later."
      />
      <Steps step={step} labels={["Company", "Details"]} />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Card>
          {step === 0 ? (
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Company name"
                htmlFor="companyName"
                required
                error={errors.companyName?.message}
                className="sm:col-span-2"
              >
                <Input
                  {...fieldControlProps("companyName", errors.companyName?.message)}
                  {...register("companyName")}
                  autoFocus
                />
              </Field>
              <Field label="Website" htmlFor="website" error={errors.website?.message}>
                <Input
                  {...fieldControlProps("website", errors.website?.message)}
                  {...register("website")}
                  inputMode="url"
                  placeholder="https://example.com"
                />
              </Field>
              <Field label="Industry" htmlFor="industry" error={errors.industry?.message}>
                <Input
                  {...fieldControlProps("industry", errors.industry?.message)}
                  {...register("industry")}
                  placeholder="Retail, SaaS, hospitality…"
                />
              </Field>
            </CardBody>
          ) : (
            <CardBody className="grid gap-4">
              <Field label="Company size" htmlFor="companySize">
                <Controller
                  control={control}
                  name="companySize"
                  render={({ field }) => (
                    <ChoicePills
                      id="companySize"
                      label="Company size"
                      options={COMPANY_SIZES.map((v) => ({ value: v, label: v }))}
                      value={field.value || undefined}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <Field label="Logo URL" htmlFor="logo" error={errors.logo?.message} hint="A link to a square image.">
                <Input
                  {...fieldControlProps("logo", errors.logo?.message, "A link to a square image.")}
                  {...register("logo")}
                  inputMode="url"
                  placeholder="https://"
                />
              </Field>
              <Field label="Description" htmlFor="description" error={errors.description?.message}>
                <Textarea
                  {...fieldControlProps("description", errors.description?.message)}
                  {...register("description")}
                  placeholder="What the company does, and who it's for."
                />
              </Field>
            </CardBody>
          )}
        </Card>

        <div className="flex items-center justify-between gap-3">
          {step === 1 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step === 0 ? (
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                if (await trigger(BRAND_STEP_ONE)) setStep(1);
              }}
            >
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" variant="gold" size="sm" loading={isSubmitting}>
              Create company profile
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
