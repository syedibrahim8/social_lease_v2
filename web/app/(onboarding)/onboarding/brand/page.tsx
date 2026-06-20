"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import {
  brandOnboardingSchema,
  type BrandOnboardingValues,
} from "@/lib/validations/onboarding";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/config/options";
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

const steps = ["Company", "Details", "Verify"] as const;

const stepFields: (keyof BrandOnboardingValues)[][] = [
  ["companyName", "website", "description"],
  ["industry", "companySize"],
  [],
];

export default function BrandOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    trigger,
    formState: { errors },
  } = useForm<BrandOnboardingValues>({
    resolver: zodResolver(brandOnboardingSchema),
    mode: "onTouched",
    defaultValues: {
      companyName: "",
      website: "",
      description: "",
      industry: "",
      companySize: "",
    },
  });

  const next = async () => {
    const ok = await trigger(stepFields[step]);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const finish = async () => {
    setSubmitting(true);
    await mockDelay(600);
    toast.success("You're all set!", {
      description: "Your brand workspace is ready.",
    });
    router.push("/dashboard");
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
          Brand onboarding
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Set up your company
        </h1>
      </div>

      <Stepper steps={steps} current={step} />

      <div className="border-border bg-card space-y-4 rounded-xl border p-6">
        {step === 0 ? (
          <>
            <Field label="Company name" htmlFor="companyName" required error={errors.companyName?.message}>
              <Input id="companyName" placeholder="Northwind Studio" {...register("companyName")} />
            </Field>
            <Field label="Website" htmlFor="website" error={errors.website?.message}>
              <Input id="website" type="url" placeholder="https://northwind.co" {...register("website")} />
            </Field>
            <Field label="Description" htmlFor="description" error={errors.description?.message} hint="What does your company do?">
              <Textarea id="description" placeholder="A short description of your brand…" {...register("description")} />
            </Field>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Industry" htmlFor="industry" required error={errors.industry?.message}>
              <Controller
                control={control}
                name="industry"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="industry" aria-invalid={!!errors.industry}>
                      <SelectValue placeholder="Select an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Company size" htmlFor="companySize" required error={errors.companySize?.message}>
              <Controller
                control={control}
                name="companySize"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="companySize" aria-invalid={!!errors.companySize}>
                      <SelectValue placeholder="Select a size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="bg-muted/50 flex gap-3 rounded-lg p-4">
              <ShieldCheck className="text-brand-text mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Verify your business</p>
                <p className="text-muted-foreground mt-1">
                  Verify your company to earn a trust badge and reassure creators
                  before they engage. This is optional and can be done later.
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
