"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { AssetTypePicker } from "@/components/assets/asset-type-picker";
import { BriefAssistant, type BriefDraft } from "@/components/ai/brief-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, fieldControlProps } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  createCampaign,
  publishCampaign,
  updateCampaign,
  type CampaignInput,
} from "@/lib/api/endpoints/campaigns";
import { ASSET_TYPES, PLATFORMS, SUPPORTED_CURRENCIES, type Campaign } from "@/lib/api/types";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { minorToMajorInput, parseMajorToMinor } from "@/lib/money";
import { invalidateFor, qk } from "@/lib/query";

/** Mirrors `campaign.validators.ts`; budgets are typed in whole currency. */
const money = z
  .string()
  .trim()
  .refine((v) => parseMajorToMinor(v) !== null, "Enter an amount, e.g. 1,500 or 1500.50");

const campaignSchema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters").max(160, "At most 160 characters"),
    description: z
      .string()
      .trim()
      .min(10, "At least 10 characters")
      .max(5000, "At most 5,000 characters"),
    platform: z.enum(PLATFORMS, { error: "Pick a platform" }),
    assetType: z.enum(ASSET_TYPES, { error: "Pick the asset" }),
    duration: z
      .string()
      .trim()
      .refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 3650, "1 to 3,650 days"),
    budgetMin: money,
    budgetMax: money,
    requirements: z
      .array(z.object({ text: z.string().trim().max(500, "At most 500 characters") }))
      .max(50, "At most 50 requirements"),
  })
  .superRefine((v, ctx) => {
    const min = parseMajorToMinor(v.budgetMin);
    const max = parseMajorToMinor(v.budgetMax);
    if (min !== null && max !== null && max < min) {
      ctx.addIssue({ code: "custom", path: ["budgetMax"], message: "Must be at least the minimum" });
    }
  });

type CampaignValues = z.infer<typeof campaignSchema>;

function toInput(values: CampaignValues): CampaignInput {
  return {
    title: values.title,
    description: values.description,
    platform: values.platform,
    assetType: values.assetType,
    duration: Number(values.duration),
    budgetMin: parseMajorToMinor(values.budgetMin) ?? 0,
    budgetMax: parseMajorToMinor(values.budgetMax) ?? 0,
    currency: SUPPORTED_CURRENCIES[0],
    requirements: values.requirements.map((r) => r.text.trim()).filter(Boolean),
  };
}

/**
 * Create or edit a campaign brief.
 *
 * A new campaign is saved as a draft (private to the brand) unless they choose
 * to publish straight away. Editing is only offered while the backend allows
 * it — DRAFT or PUBLISHED.
 */
export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Which create button is spinning. The submit itself reads the event.
  const [intent, setIntent] = useState<"draft" | "publish">("draft");
  const editing = Boolean(campaign);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: campaign
      ? {
          title: campaign.title,
          description: campaign.description,
          platform: campaign.platform,
          assetType: campaign.assetType,
          duration: String(campaign.duration),
          budgetMin: minorToMajorInput(campaign.budgetMin),
          budgetMax: minorToMajorInput(campaign.budgetMax),
          requirements: campaign.requirements.map((text) => ({ text })),
        }
      : { title: "", description: "", duration: "14", budgetMin: "", budgetMax: "", requirements: [] },
  });

  const requirements = useFieldArray({ control, name: "requirements" });
  const platform = useWatch({ control, name: "platform" });

  const applyDraft = (draft: BriefDraft) => {
    setValue("title", draft.title.slice(0, 160), { shouldDirty: true });
    setValue("description", draft.description.slice(0, 5000), { shouldDirty: true });
    if (draft.requirements.length > 0) {
      requirements.replace(draft.requirements.slice(0, 50).map((text) => ({ text: text.slice(0, 500) })));
    }
  };

  const onSubmit = handleSubmit(async (values, event) => {
    // Read the pressed button from the event: state set in its onClick isn't
    // visible to this render's handler yet.
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter;
    const publish = submitter?.dataset.intent === "publish";
    const input = toInput(values);
    try {
      let saved = campaign
        ? await updateCampaign(campaign.id, input)
        : await createCampaign(input);
      if (!campaign && publish) saved = await publishCampaign(saved.id);
      invalidateFor(queryClient, "campaign", [qk.campaign(saved.id)]);
      toast.success(
        editing
          ? "Campaign updated."
          : saved.status === "PUBLISHED"
            ? "Campaign published. Creators can apply now."
            : "Draft saved. Publish it when you're ready.",
      );
      router.push(`/marketplace/${saved.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message);
        return;
      }
      applyServerErrors(error, setError, "Could not save the campaign.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-bone text-[13px] font-medium">The brief</p>
              <p className="text-muted mt-0.5 text-[12px]">What creators read before they apply.</p>
            </div>
            <BriefAssistant
              platform={platform}
              defaultProduct={getValues("description")}
              onUse={applyDraft}
            />
          </div>
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input {...fieldControlProps("title", errors.title?.message)} {...register("title")} />
          </Field>
          <Field label="Description" htmlFor="description" required error={errors.description?.message}>
            <Textarea
              {...fieldControlProps("description", errors.description?.message)}
              {...register("description")}
              className="min-h-40"
              placeholder="The product, the audience, and what a great result looks like."
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Controller
            control={control}
            name="platform"
            render={({ field: platformField }) => (
              <Controller
                control={control}
                name="assetType"
                render={({ field: typeField }) => (
                  <AssetTypePicker
                    platform={platformField.value}
                    assetType={typeField.value}
                    onChange={(next) => {
                      if (next.platform) platformField.onChange(next.platform);
                      typeField.onChange(next.assetType);
                    }}
                    platformError={errors.platform?.message}
                    typeError={errors.assetType?.message}
                  />
                )}
              />
            )}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field
            label={`Budget from (${SUPPORTED_CURRENCIES[0]})`}
            htmlFor="budgetMin"
            required
            error={errors.budgetMin?.message}
          >
            <Input
              {...fieldControlProps("budgetMin", errors.budgetMin?.message)}
              {...register("budgetMin")}
              inputMode="decimal"
              placeholder="500"
              className="tnum"
            />
          </Field>
          <Field
            label={`Budget to (${SUPPORTED_CURRENCIES[0]})`}
            htmlFor="budgetMax"
            required
            error={errors.budgetMax?.message}
          >
            <Input
              {...fieldControlProps("budgetMax", errors.budgetMax?.message)}
              {...register("budgetMax")}
              inputMode="decimal"
              placeholder="1,500"
              className="tnum"
            />
          </Field>
          <Field
            label="Stays live for (days)"
            htmlFor="duration"
            required
            error={errors.duration?.message}
          >
            <Input
              {...fieldControlProps("duration", errors.duration?.message)}
              {...register("duration")}
              inputMode="numeric"
              className="tnum"
            />
          </Field>
          <p className="text-muted text-[11px] leading-relaxed sm:col-span-3">
            The final price is agreed with the creator, then held in escrow before work starts.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-bone text-[13px] font-medium">Requirements</p>
              <p className="text-muted mt-0.5 text-[12px]">
                Each one becomes a deliverable on the contract.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={requirements.fields.length >= 50}
              onClick={() => requirements.append({ text: "" })}
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
          {requirements.fields.length === 0 ? (
            <p className="text-muted text-[12px]">No requirements yet.</p>
          ) : (
            <ul className="space-y-2">
              {requirements.fields.map((item, index) => {
                const message = errors.requirements?.[index]?.text?.message;
                const id = `requirement-${index}`;
                return (
                  <li key={item.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={id} className="sr-only">
                        Requirement {index + 1}
                      </label>
                      <Input
                        {...fieldControlProps(id, message)}
                        {...register(`requirements.${index}.text`)}
                        placeholder="e.g. Tag @brand in the caption"
                      />
                      {message ? (
                        <p id={`${id}-error`} role="alert" className="text-negative mt-1 text-[11px]">
                          {message}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove requirement ${index + 1}`}
                      onClick={() => requirements.remove(index)}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Cancel
        </Button>
        {editing ? (
          <Button type="submit" variant="gold" size="sm" loading={isSubmitting}>
            Save changes
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              size="sm"
              loading={isSubmitting && intent === "draft"}
              data-intent="draft"
              onClick={() => setIntent("draft")}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              loading={isSubmitting && intent === "publish"}
              data-intent="publish"
              onClick={() => setIntent("publish")}
            >
              Save and publish
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
