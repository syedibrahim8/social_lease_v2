"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldControlProps } from "@/components/ui/field";
import { forgotPassword } from "@/lib/api/endpoints/auth";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (error) {
      applyServerErrors(error, setError, "Could not send the reset link.");
    }
  });

  if (sent) {
    return (
      <div className="text-center">
        <span className="bg-positive/10 text-positive mx-auto grid size-11 place-items-center rounded-xl">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <h1 className="font-display text-bone mt-4 text-2xl">Check your inbox</h1>
        {/*
          Deliberately does not confirm whether the address exists. Saying "no
          account with that email" turns this form into a way to test which
          addresses are registered.
        */}
        <p className="text-muted mt-2 text-[13px] leading-relaxed">
          If an account exists for {getValues("email")}, a reset link is on its way. The link
          expires shortly, so use it soon.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-bone text-2xl">Reset your password</h1>
      <p className="text-muted mt-1.5 text-[13px]">
        We will email you a link to choose a new one.
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            {...fieldControlProps("email", errors.email?.message)}
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Field>

        <Button type="submit" variant="gold" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>

        <Link
          href="/login"
          className="text-muted hover:text-bone text-center text-xs transition-colors"
        >
          Back to sign in
        </Link>
      </form>
    </>
  );
}
