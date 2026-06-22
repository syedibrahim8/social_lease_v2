"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Laptop, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { mockDelay } from "@/lib/api/adapter";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type SecurityValues = z.infer<typeof schema>;

const sessions = [
  { id: "s1", device: "MacBook Pro · Chrome", location: "Lagos, NG", current: true, icon: Laptop },
  { id: "s2", device: "iPhone 15 · Safari", location: "Lagos, NG", current: false, icon: Smartphone },
];

export function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecurityValues>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    setLoading(true);
    await mockDelay(500);
    setLoading(false);
    reset();
    toast.success("Password updated");
  };

  return (
    <div className="max-w-xl space-y-6">
      <Card className="gap-5 p-6">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="text-muted-foreground text-sm">
            Use a strong password you don&apos;t reuse elsewhere.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          </Field>
          <Button type="submit" variant="brand" loading={loading}>
            Update password
          </Button>
        </form>
      </Card>

      <Card className="gap-0 p-0">
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-sm font-semibold">Active sessions</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Signed out of other sessions")}
          >
            Sign out others
          </Button>
        </div>
        <ul className="divide-border divide-y">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-6 py-4">
              <span className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-lg">
                <s.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.device}</p>
                <p className="text-muted-foreground text-xs">{s.location}</p>
              </div>
              {s.current ? (
                <span className="bg-success-muted text-success-text ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
                  This device
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
