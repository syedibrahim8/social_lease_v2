"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldControlProps } from "@/components/ui/field";
import { useAuth } from "@/lib/auth/auth-provider";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export default function LoginPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise. Client components read it with use().
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = use(searchParams);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      // Honour the deep link the gate preserved, so a link to a specific
      // contract survives the trip through sign-in.
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    } catch (error) {
      applyServerErrors(error, setError, "Could not sign you in.");
    }
  });

  return (
    <>
      <h1 className="font-display text-bone text-2xl">Sign in</h1>
      <p className="text-muted mt-1.5 text-[13px]">
        New here?{" "}
        <Link href="/register" className="text-gold-lo hover:underline">
          Create an account
        </Link>
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

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            {...fieldControlProps("password", errors.password?.message)}
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>

        <div className="-mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            // -my-2 py-2 gives a 36px tap area without adding visual space.
            className="text-muted hover:text-bone -my-2 py-2 text-xs transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" variant="gold" loading={isSubmitting} className="mt-1 w-full">
          Sign in
        </Button>
      </form>
    </>
  );
}
