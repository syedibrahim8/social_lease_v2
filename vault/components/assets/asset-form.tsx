"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { AssetTypePicker } from "@/components/assets/asset-type-picker";
import { PriceSuggest } from "@/components/ai/price-suggest";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ChoicePills } from "@/components/ui/choice-pills";
import { Field, fieldControlProps } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import {
  AVAILABILITY_STATUSES,
  createAsset,
  updateAsset,
  type AssetInput,
  type AssetListing,
} from "@/lib/api/endpoints/assets";
import { ASSET_TYPES, PLATFORMS, SUPPORTED_CURRENCIES } from "@/lib/api/types";
import { applyServerErrors } from "@/lib/auth/use-server-errors";
import { minorToMajorInput, parseMajorToMinor } from "@/lib/money";
import { invalidateFor, qk } from "@/lib/query";

const AVAILABILITY_LABEL = { AVAILABLE: "Available", BUSY: "Busy", UNAVAILABLE: "Unavailable" } as const;

const wholeNumber = (message: string, max?: number) =>
  z
    .string()
    .trim()
    .refine((v) => {
      if (v === "") return true;
      const cleaned = v.replace(/,/g, "");
      return /^\d+$/.test(cleaned) && (max === undefined || Number(cleaned) <= max);
    }, message);

const percent = z
  .string()
  .trim()
  .refine((v) => v === "" || (Number(v) >= 0 && Number(v) <= 100), "0 to 100");

/** Mirrors `asset.validators.ts`. */
const assetSchema = z.object({
  platform: z.enum(PLATFORMS, { error: "Pick a platform" }),
  assetType: z.enum(ASSET_TYPES, { error: "Pick the asset" }),
  title: z.string().trim().min(3, "At least 3 characters").max(160, "At most 160 characters"),
  description: z
    .string()
    .trim()
    .min(10, "At least 10 characters")
    .max(2000, "At most 2,000 characters"),
  price: z
    .string()
    .trim()
    .refine((v) => v === "" || parseMajorToMinor(v) !== null, "Enter an amount, e.g. 450"),
  estimatedReach: wholeNumber("Enter a whole number"),
  averageViews: wholeNumber("Enter a whole number"),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES),
  leadTimeDays: wholeNumber("0 to 365 days", 365),
  male: percent,
  female: percent,
  other: percent,
  topCountries: z
    .array(z.object({ country: z.string().trim().max(60), percentage: percent }))
    .max(20),
  topCities: z.string().trim(),
});

type AssetValues = z.infer<typeof assetSchema>;

const int = (v: string) => Number(v.replace(/,/g, ""));

function toInput(v: AssetValues): AssetInput {
  const genderSplit: { male?: number; female?: number; other?: number } = {};
  if (v.male) genderSplit.male = Number(v.male);
  if (v.female) genderSplit.female = Number(v.female);
  if (v.other) genderSplit.other = Number(v.other);
  const topCountries = v.topCountries
    .filter((c) => c.country && c.percentage)
    .map((c) => ({ country: c.country, percentage: Number(c.percentage) }));
  const topCities = v.topCities
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 20);

  const price = v.price ? parseMajorToMinor(v.price) : null;
  return {
    platform: v.platform,
    assetType: v.assetType,
    title: v.title,
    description: v.description,
    ...(price !== null ? { price, currency: SUPPORTED_CURRENCIES[0] } : {}),
    ...(v.estimatedReach ? { estimatedReach: int(v.estimatedReach) } : {}),
    ...(v.averageViews ? { averageViews: int(v.averageViews) } : {}),
    availability: {
      status: v.availabilityStatus,
      ...(v.leadTimeDays ? { leadTimeDays: int(v.leadTimeDays) } : {}),
    },
    audienceDemographics: {
      ...(Object.keys(genderSplit).length ? { genderSplit } : {}),
      ...(topCountries.length ? { topCountries } : {}),
      ...(topCities.length ? { topCities } : {}),
    },
  };
}

function defaults(asset?: AssetListing): Partial<AssetValues> {
  if (!asset) {
    return {
      title: "",
      description: "",
      price: "",
      estimatedReach: "",
      averageViews: "",
      availabilityStatus: "AVAILABLE",
      leadTimeDays: "",
      male: "",
      female: "",
      other: "",
      topCountries: [],
      topCities: "",
    };
  }
  const d = asset.audienceDemographics;
  return {
    platform: asset.platform,
    assetType: asset.assetType,
    title: asset.title,
    description: asset.description,
    price: asset.price !== undefined ? minorToMajorInput(asset.price) : "",
    estimatedReach: asset.estimatedReach ? String(asset.estimatedReach) : "",
    averageViews: asset.averageViews ? String(asset.averageViews) : "",
    availabilityStatus: asset.availability.status,
    leadTimeDays:
      asset.availability.leadTimeDays !== undefined ? String(asset.availability.leadTimeDays) : "",
    male: d?.genderSplit?.male !== undefined ? String(d.genderSplit.male) : "",
    female: d?.genderSplit?.female !== undefined ? String(d.genderSplit.female) : "",
    other: d?.genderSplit?.other !== undefined ? String(d.genderSplit.other) : "",
    topCountries: (d?.topCountries ?? []).map((c) => ({
      country: c.country,
      percentage: String(c.percentage),
    })),
    topCities: (d?.topCities ?? []).join(", "),
  };
}

/** Create or edit a listing. The calendar is managed on the listing page. */
export function AssetForm({ asset }: { asset?: AssetListing }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssetValues>({ resolver: zodResolver(assetSchema), defaultValues: defaults(asset) });

  const countries = useFieldArray({ control, name: "topCountries" });
  const platform = useWatch({ control, name: "platform" });
  const assetType = useWatch({ control, name: "assetType" });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = asset ? await updateAsset(asset.id, toInput(values)) : await createAsset(toInput(values));
      invalidateFor(queryClient, "asset", [qk.asset(saved.id)]);
      toast.success(asset ? "Listing updated." : "Listing published. Brands can find it now.");
      router.push(`/listings/${saved.id}`);
    } catch (error) {
      applyServerErrors(error, setError, "Could not save the listing.");
    }
  });

  const numberField = (name: "estimatedReach" | "averageViews" | "leadTimeDays", label: string, hint?: string) => (
    <Field label={label} htmlFor={name} error={errors[name]?.message} hint={hint}>
      <Input
        {...fieldControlProps(name, errors[name]?.message, hint)}
        {...register(name)}
        inputMode="numeric"
        className="tnum"
      />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
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
        <CardBody className="space-y-4">
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input
              {...fieldControlProps("title", errors.title?.message)}
              {...register("title")}
              placeholder="Pinned post on my TikTok for 7 days"
            />
          </Field>
          <Field label="Description" htmlFor="description" required error={errors.description?.message}>
            <Textarea
              {...fieldControlProps("description", errors.description?.message)}
              {...register("description")}
              placeholder="Who sees it, what you'll make, and how long it stays up."
            />
          </Field>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardBody className="space-y-4">
            <Field
              label={`Asking price (${SUPPORTED_CURRENCIES[0]})`}
              htmlFor="price"
              error={errors.price?.message}
              hint="Leave blank to agree a price per campaign."
            >
              <Input
                {...fieldControlProps("price", errors.price?.message, "Leave blank to agree a price per campaign.")}
                {...register("price")}
                inputMode="decimal"
                className="tnum"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {numberField("estimatedReach", "Estimated reach")}
              {numberField("averageViews", "Average views")}
            </div>
          </CardBody>
        </Card>
        <PriceSuggest
          platform={platform}
          assetType={assetType}
          onApply={(minor) => setValue("price", minorToMajorInput(minor), { shouldDirty: true })}
        />
      </div>

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Availability" htmlFor="availabilityStatus">
            <Controller
              control={control}
              name="availabilityStatus"
              render={({ field }) => (
                <ChoicePills
                  id="availabilityStatus"
                  label="Availability"
                  options={AVAILABILITY_STATUSES.map((s) => ({ value: s, label: AVAILABILITY_LABEL[s] }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>
          {numberField("leadTimeDays", "Lead time (days)", "Notice you need before a booking.")}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <p className="text-bone text-[13px] font-medium">Audience</p>
            <p className="text-muted mt-0.5 text-[12px]">Optional. Brands filter and compare on these.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["female", "male", "other"] as const).map((g) => (
              <Field key={g} label={`${g[0]?.toUpperCase()}${g.slice(1)} (%)`} htmlFor={g} error={errors[g]?.message}>
                <Input {...fieldControlProps(g, errors[g]?.message)} {...register(g)} inputMode="decimal" className="tnum" />
              </Field>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-bone-2 text-xs font-medium">Top countries</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={countries.fields.length >= 20}
                onClick={() => countries.append({ country: "", percentage: "" })}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
            {countries.fields.map((item, i) => (
              <div key={item.id} className="flex items-start gap-2">
                <label htmlFor={`country-${i}`} className="sr-only">
                  Country {i + 1}
                </label>
                <Input id={`country-${i}`} {...register(`topCountries.${i}.country`)} placeholder="Country" />
                <label htmlFor={`country-pct-${i}`} className="sr-only">
                  Share of audience, country {i + 1}
                </label>
                <Input
                  id={`country-pct-${i}`}
                  {...register(`topCountries.${i}.percentage`)}
                  placeholder="%"
                  inputMode="decimal"
                  className="tnum w-24"
                  aria-invalid={errors.topCountries?.[i]?.percentage ? true : undefined}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove country ${i + 1}`}
                  onClick={() => countries.remove(i)}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          <Field label="Top cities" htmlFor="topCities" hint="Comma-separated, e.g. Lagos, London, Toronto">
            <Input {...fieldControlProps("topCities", undefined, "Comma-separated, e.g. Lagos, London, Toronto")} {...register("topCities")} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" size="sm" loading={isSubmitting}>
          {asset ? "Save changes" : "Publish listing"}
        </Button>
      </div>
    </form>
  );
}
