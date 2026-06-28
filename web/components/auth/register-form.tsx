"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { useAuth } from "@/lib/auth/auth-provider";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const roleOptions = [
  { value: "CREATOR", label: "I'm a Creator", hint: "Find campaigns & get paid" },
  { value: "BRAND", label: "I'm a Brand", hint: "Run campaigns & hire creators" },
] as const;

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isMock } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { role: "CREATOR" },
  });

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      // Manual signups must verify their email first; mock/demo skips straight to onboarding.
      if (isMock) {
        router.push(`/onboarding/${values.role.toLowerCase()}`);
      } else {
        router.push("/verify-email");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field error={errors.role?.message}>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-2 gap-3"
            >
              {roleOptions.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`role-${opt.value}`}
                  className={cn(
                    "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors",
                    field.value === opt.value
                      ? "border-brand bg-brand-muted/40"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opt.label}</span>
                    <RadioGroupItem id={`role-${opt.value}`} value={opt.value} />
                  </div>
                  <span className="text-muted-foreground text-xs font-normal">
                    {opt.hint}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          )}
        />
      </Field>

      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input
          id="name"
          placeholder="Maya Okonkwo"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
      </Field>
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
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>

      {error ? (
        <p className="bg-danger-muted text-danger-text rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full"
        loading={loading}
      >
        Create account
      </Button>
    </form>
  );
}
