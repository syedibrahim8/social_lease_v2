"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BadgeCheck, CreditCard } from "lucide-react";
import {
  creatorOnboardingSchema,
  type CreatorOnboardingValues,
} from "@/lib/validations/onboarding";
import { NICHES, PLATFORMS } from "@/lib/config/options";
import { Stepper } from "@/components/onboarding/stepper";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockDelay } from "@/lib/api/adapter";

const steps = ["Profile", "Audience", "Payouts", "Verify"] as const;

const stepFields: (keyof CreatorOnboardingValues)[][] = [
  ["displayName", "location", "bio"],
  ["niche", "primaryPlatform", "handle", "followers"],
  [],
  [],
];

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    trigger,
    formState: { errors },
  } = useForm<CreatorOnboardingValues>({
    resolver: zodResolver(creatorOnboardingSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: "",
      location: "",
      bio: "",
      niche: "",
      primaryPlatform: "",
      handle: "",
      followers: 0,
    },
  });

  const next = async () => {
    const ok = await trigger(stepFields[step]);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const finish = async () => {
    setSubmitting(true);
    await mockDelay(600);
    toast.success("Welcome aboard!", {
      description: "Your creator profile is ready.",
    });
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
          Creator onboarding
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Set up your profile
        </h1>
      </div>

      <Stepper steps={steps} current={step} />

      <div className="border-border bg-card space-y-4 rounded-xl border p-6">
        {step === 0 ? (
          <>
            <Field label="Display name" htmlFor="displayName" required error={errors.displayName?.message}>
              <Input id="displayName" placeholder="Maya Okonkwo" {...register("displayName")} />
            </Field>
            <Field label="Location" htmlFor="location" error={errors.location?.message}>
              <Input id="location" placeholder="Lagos, Nigeria" {...register("location")} />
            </Field>
            <Field label="Bio" htmlFor="bio" error={errors.bio?.message} hint="A short intro for brands.">
              <Textarea id="bio" placeholder="Tell brands about your audience and style…" {...register("bio")} />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Primary niche" htmlFor="niche" required error={errors.niche?.message}>
              <Controller
                control={control}
                name="niche"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="niche" aria-invalid={!!errors.niche}>
                      <SelectValue placeholder="Select a niche" />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHES.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Primary platform" htmlFor="primaryPlatform" required error={errors.primaryPlatform?.message}>
              <Controller
                control={control}
                name="primaryPlatform"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="primaryPlatform" aria-invalid={!!errors.primaryPlatform}>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Handle" htmlFor="handle" required error={errors.handle?.message}>
              <Input id="handle" placeholder="@mayacreates" {...register("handle")} />
            </Field>
            <Field label="Followers" htmlFor="followers" required error={errors.followers?.message}>
              <Input
                id="followers"
                type="number"
                min={0}
                placeholder="125000"
                {...register("followers", { valueAsNumber: true })}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="bg-muted/50 flex gap-3 rounded-lg p-4">
              <CreditCard className="text-brand-text mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Connect a payout account</p>
                <p className="text-muted-foreground mt-1">
                  Payouts run through Stripe Connect. Funds are held in escrow and
                  released to this account when a brand approves your work.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="brand"
              className="w-full"
              onClick={() =>
                toast.message("Stripe Connect", {
                  description: "Hosted onboarding opens here once Stripe is live.",
                })
              }
            >
              Connect with Stripe
            </Button>
            <p className="text-muted-foreground text-center text-xs">
              You can finish this later from Wallet — but you can’t be paid until it’s done.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="bg-muted/50 flex gap-3 rounded-lg p-4">
              <BadgeCheck className="text-brand-text mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Get verified</p>
                <p className="text-muted-foreground mt-1">
                  Verify your identity and profile ownership to build trust and
                  unlock more campaigns. This is optional and can be done later.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() =>
                toast.message("Verification", {
                  description: "Submit verification later from the Verification page.",
                })
              }
            >
              Start verification
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button variant="brand" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button variant="brand" loading={submitting} onClick={finish}>
            Finish setup
          </Button>
        )}
      </div>
    </div>
  );
}
