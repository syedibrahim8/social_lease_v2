"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, fieldControlProps } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  SOCIAL_NETWORKS,
  updateMyCreatorProfile,
  type CreatorProfile,
} from "@/lib/api/endpoints/profiles";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { SOCIAL_NETWORK_LABEL } from "@/lib/config/labels";
import { invalidateFor } from "@/lib/query";
import {
  EMPTY_SOCIALS,
  creatorProfileSchema,
  socialLinksPayload,
} from "@/lib/validations/profile";

const reachSchema = creatorProfileSchema.pick({
  socials: true,
  followers: true,
  engagementRate: true,
  averageReach: true,
});
type ReachValues = z.infer<typeof reachSchema>;

function valuesFrom(profile: CreatorProfile): ReachValues {
  const socials = { ...EMPTY_SOCIALS };
  for (const network of SOCIAL_NETWORKS) socials[network] = profile.socialLinks?.[network] ?? "";
  const m = profile.metrics;
  return {
    socials,
    followers: m?.followers ? String(m.followers) : "",
    engagementRate: m?.engagementRate ? String(m.engagementRate) : "",
    averageReach: m?.averageReach ? String(m.averageReach) : "",
  };
}

/**
 * Audience numbers and channel links.
 *
 * These feed brand search ranking and price suggestions, so they live next to
 * the profile rather than buried. The whole link set is sent on save: the
 * server replaces it, so an emptied link really is removed.
 */
export function ReachSettings({ profile }: { profile: CreatorProfile }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ReachValues>({ resolver: zodResolver(reachSchema), defaultValues: valuesFrom(profile) });

  useEffect(() => {
    reset(valuesFrom(profile));
  }, [profile, reset]);

  const save = useMutation({
    mutationFn: (values: ReachValues) => {
      const toInt = (v: string) => Number(v.replace(/,/g, ""));
      return updateMyCreatorProfile({
        socialLinks: socialLinksPayload(values.socials),
        metrics: {
          followers: values.followers ? toInt(values.followers) : 0,
          engagementRate: values.engagementRate ? Number(values.engagementRate) : 0,
          averageReach: values.averageReach ? toInt(values.averageReach) : 0,
        },
      });
    },
    onSuccess: () => {
      invalidateFor(queryClient, "profile");
      toast.success("Audience and channels saved.");
    },
    onError: (error) => applyServerErrors(error, setError, "Could not save your channels."),
  });

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="text-bone text-[13px] font-medium">Audience</p>
            <p className="text-muted mt-0.5 text-[12px]">
              Used to rank you in brand searches and to suggest prices.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Followers" htmlFor="reach-followers" error={errors.followers?.message}>
              <Input
                {...fieldControlProps("reach-followers", errors.followers?.message)}
                {...register("followers")}
                inputMode="numeric"
                className="tnum"
              />
            </Field>
            <Field
              label="Engagement rate (%)"
              htmlFor="reach-engagement"
              error={errors.engagementRate?.message}
            >
              <Input
                {...fieldControlProps("reach-engagement", errors.engagementRate?.message)}
                {...register("engagementRate")}
                inputMode="decimal"
                className="tnum"
              />
            </Field>
            <Field label="Average reach" htmlFor="reach-average" error={errors.averageReach?.message}>
              <Input
                {...fieldControlProps("reach-average", errors.averageReach?.message)}
                {...register("averageReach")}
                inputMode="numeric"
                className="tnum"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <p className="text-bone text-[13px] font-medium">Channels</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((network) => {
              const id = `reach-${network}`;
              const message = errors.socials?.[network]?.message;
              return (
                <Field key={network} label={SOCIAL_NETWORK_LABEL[network]} htmlFor={id} error={message}>
                  <Input
                    {...fieldControlProps(id, message)}
                    {...register(`socials.${network}`)}
                    inputMode="url"
                    placeholder="https://"
                  />
                </Field>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="gold" size="sm" loading={save.isPending} disabled={!isDirty}>
          Save audience and channels
        </Button>
      </div>
    </form>
  );
}
