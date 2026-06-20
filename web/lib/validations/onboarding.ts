import { z } from "zod";

/* ---- Creator wizard ---- */

export const creatorProfileSchema = z.object({
  displayName: z.string().min(2, "Enter a display name"),
  location: z.string().optional(),
  bio: z.string().max(280, "Keep it under 280 characters").optional(),
});
export type CreatorProfileValues = z.infer<typeof creatorProfileSchema>;

export const creatorAudienceSchema = z.object({
  niche: z.string().min(1, "Pick a niche"),
  primaryPlatform: z.string().min(1, "Pick a platform"),
  handle: z.string().min(1, "Enter your handle"),
  followers: z
    .number({ message: "Enter your follower count" })
    .int("Enter a whole number")
    .min(0, "Must be 0 or more"),
});
export type CreatorAudienceValues = z.infer<typeof creatorAudienceSchema>;

/* ---- Brand wizard ---- */

export const brandCompanySchema = z.object({
  companyName: z.string().min(2, "Enter a company name"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  description: z.string().max(280, "Keep it under 280 characters").optional(),
});
export type BrandCompanyValues = z.infer<typeof brandCompanySchema>;

export const brandDetailsSchema = z.object({
  industry: z.string().min(1, "Pick an industry"),
  companySize: z.string().min(1, "Pick a company size"),
});
export type BrandDetailsValues = z.infer<typeof brandDetailsSchema>;

/* ---- Combined wizard schemas (validated step-by-step via form.trigger) ---- */

export const creatorOnboardingSchema = z.object({
  ...creatorProfileSchema.shape,
  ...creatorAudienceSchema.shape,
});
export type CreatorOnboardingValues = z.infer<typeof creatorOnboardingSchema>;

export const brandOnboardingSchema = z.object({
  ...brandCompanySchema.shape,
  ...brandDetailsSchema.shape,
});
export type BrandOnboardingValues = z.infer<typeof brandOnboardingSchema>;
