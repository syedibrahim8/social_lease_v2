"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockDelay } from "@/lib/api/adapter";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setLoading(true);
    await mockDelay(500);
    setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="bg-brand-muted text-brand-text mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </div>
        <p className="mt-4 text-sm font-medium">Check your inbox</p>
        <p className="text-muted-foreground mt-1 text-sm">
          If an account exists for{" "}
          <span className="text-foreground font-medium">{sentTo}</span>, we’ve sent
          a password reset link.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full"
        loading={loading}
      >
        Send reset link
      </Button>
    </form>
  );
}
