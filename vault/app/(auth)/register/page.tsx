"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, fieldControlProps } from "@/components/ui/field";
import { useAuth } from "@/lib/auth/auth-provider";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "CREATOR" as const,
    icon: Sparkles,
    title: "I'm a creator",
    copy: "Apply to campaigns and get paid from escrow.",
  },
  {
    value: "BRAND" as const,
    icon: Megaphone,
    title: "I'm a brand",
    copy: "Post campaigns and fund work up front.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: "CREATOR" },
  });

  // useWatch rather than watch(): watch() returns a fresh function each render
  // that React Compiler cannot memoize, which opts the whole component out of
  // memoization.
  const role = useWatch({ control, name: "role" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signUp(values);
      router.replace("/dashboard");
    } catch (error) {
      applyServerErrors(error, setError, "Could not create your account.");
    }
  });

  return (
    <>
      <h1 className="font-display text-bone text-2xl">Create your account</h1>
      <p className="text-muted mt-1.5 text-[13px]">
        Already have one?{" "}
        <Link href="/login" className="text-gold-lo hover:underline">
          Sign in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4" noValidate>
        {/* Radio group rather than a select: this choice changes the whole
            product, so it should be visible rather than hidden in a dropdown.
            ADMIN is absent because the backend refuses to self-assign it. */}
        <fieldset>
          <legend className="text-bone-2 mb-2 text-xs font-medium">
            How will you use Vault?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.value;
              return (
                <label
                  key={r.value}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 transition-colors",
                    active
                      ? "border-gold/45 bg-gold/[0.07]"
                      : "border-line-2 hover:border-bone/20",
                  )}
                >
                  <input
                    type="radio"
                    value={r.value}
                    checked={active}
                    onChange={() => setValue("role", r.value, { shouldValidate: true })}
                    className="sr-only"
                    name="role"
                  />
                  <Icon
                    className={cn("size-4", active ? "text-gold-lo" : "text-muted")}
                    aria-hidden="true"
                  />
                  <p
                    className={cn(
                      "mt-2 text-[13px] font-medium",
                      active ? "text-bone" : "text-bone-2",
                    )}
                  >
                    {r.title}
                  </p>
                  <p className="text-muted mt-0.5 text-[11px] leading-snug">{r.copy}</p>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Name" htmlFor="name" error={errors.name?.message} required>
          <Input
            {...fieldControlProps("name", errors.name?.message)}
            {...register("name")}
            autoComplete="name"
            placeholder={role === "BRAND" ? "Northwind Studio" : "Maya Okonkwo"}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input
            {...fieldControlProps("email", errors.email?.message)}
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Field>

        <Field
          label="Password"
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

        <Button type="submit" variant="gold" loading={isSubmitting} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </>
  );
}
