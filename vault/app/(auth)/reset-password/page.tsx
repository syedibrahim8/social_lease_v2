"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldControlProps } from "@/components/ui/field";
import { resetPassword } from "@/lib/api/endpoints/auth";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const router = useRouter();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    try {
      await resetPassword(token, values.password);
      setDone(true);
      toast.success("Password changed. Sign in with your new one.");
      router.replace("/login");
    } catch (error) {
      applyServerErrors(error, setError, "That reset link is no longer valid.");
    }
  });

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-bone text-2xl">This link is incomplete</h1>
        <p className="text-muted mt-2 text-[13px] leading-relaxed">
          The reset link is missing its token. Request a new one and use the most recent
          email.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-6">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-bone text-2xl">Choose a new password</h1>
      <p className="text-muted mt-1.5 text-[13px]">
        Signing in again afterwards will end any other active session.
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        <Field
          label="New password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters, including a letter and a number."
          required
        >
          <Input
            {...fieldControlProps(
              "password",
              errors.password?.message,
              "At least 8 characters, including a letter and a number.",
            )}
            {...register("password")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Field>

        <Button
          type="submit"
          variant="gold"
          loading={isSubmitting}
          disabled={done}
          className="w-full"
        >
          Change password
        </Button>
      </form>
    </>
  );
}
