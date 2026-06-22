"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockDelay } from "@/lib/api/adapter";

const schema = z.object({
  name: z.string().min(2, "Required"),
  secondary: z.string().optional(),
  bio: z.string().max(280, "Keep it under 280 characters").optional(),
});
type ProfileValues = z.infer<typeof schema>;

export function ProfileSettings() {
  const { role, user } = useAuth();
  const isBrand = role === "BRAND";
  const labels = isBrand
    ? { name: "Company name", secondary: "Website", bio: "Description" }
    : { name: "Display name", secondary: "Location", bio: "Bio" };

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, secondary: "", bio: "" },
  });

  const onSubmit = async () => {
    setLoading(true);
    await mockDelay(500);
    setLoading(false);
    toast.success("Profile updated");
  };

  return (
    <Card className="max-w-xl gap-5 p-6">
      <div>
        <h3 className="text-sm font-semibold">Profile</h3>
        <p className="text-muted-foreground text-sm">
          This information appears on your public profile.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label={labels.name} htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" hint="Contact support to change your email.">
          <Input id="email" value={user.email} disabled />
        </Field>
        <Field label={labels.secondary} htmlFor="secondary" error={errors.secondary?.message}>
          <Input id="secondary" {...register("secondary")} />
        </Field>
        <Field label={labels.bio} htmlFor="bio" error={errors.bio?.message}>
          <Textarea id="bio" {...register("bio")} />
        </Field>
        <Button type="submit" variant="brand" loading={loading}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
