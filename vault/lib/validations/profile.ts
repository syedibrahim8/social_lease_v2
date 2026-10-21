import { z } from "zod";
import { COMPANY_SIZES, SOCIAL_NETWORKS, type SocialLinks } from "@/lib/api/endpoints/profiles";

/**
 * Mirrors `creator.validators.ts` / `brand.validators.ts` on the backend.
 *
 * Form values are strings (that's what inputs hold); empty means "not given"
 * and is dropped from the payload rather than sent, because the server's url
 * and number rules reject "".
 */

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Enter a full URL, including https://");

const optionalWholeNumber = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+$/.test(v.replace(/,/g, "")), "Enter a whole number");

const optionalPercent = z
  .string()
  .trim()
  .refine((v) => {
    if (v === "") return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 100;
  }, "Enter a percentage between 0 and 100");

export const socialLinksSchema = z.object({
  instagram: optionalUrl,
  tiktok: optionalUrl,
  youtube: optionalUrl,
  twitter: optionalUrl,
  linkedin: optionalUrl,
  facebook: optionalUrl,
  threads: optionalUrl,
  pinterest: optionalUrl,
  snapchat: optionalUrl,
  twitch: optionalUrl,
});

export const creatorProfileSchema = z.object({
  displayName: z.string().trim().min(2, "At least 2 characters").max(80, "At most 80 characters"),
  niche: z.string().trim().max(80, "At most 80 characters"),
  location: z.string().trim().max(120, "At most 120 characters"),
  bio: z.string().trim().max(1000, "At most 1,000 characters"),
  socials: socialLinksSchema,
  followers: optionalWholeNumber,
  engagementRate: optionalPercent,
  averageReach: optionalWholeNumber,
});

export const brandProfileSchema = z.object({
  companyName: z.string().trim().min(2, "At least 2 characters").max(120, "At most 120 characters"),
  website: optionalUrl,
  logo: optionalUrl,
  industry: z.string().trim().max(80, "At most 80 characters"),
  companySize: z.union([z.enum(COMPANY_SIZES), z.literal("")]),
  description: z.string().trim().max(2000, "At most 2,000 characters"),
});

export type CreatorProfileValues = z.infer<typeof creatorProfileSchema>;
export type BrandProfileValues = z.infer<typeof brandProfileSchema>;

export const EMPTY_SOCIALS = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n, ""])) as Record<
  (typeof SOCIAL_NETWORKS)[number],
  string
>;

const toInt = (v: string) => Number(v.replace(/,/g, ""));

/** Only the links that were filled in. */
export function socialLinksPayload(values: Record<string, string>): SocialLinks {
  const links: SocialLinks = {};
  for (const network of SOCIAL_NETWORKS) {
    const v = values[network]?.trim();
    if (v) links[network] = v;
  }
  return links;
}

export function creatorPayload(values: CreatorProfileValues) {
  const metrics: { followers?: number; engagementRate?: number; averageReach?: number } = {};
  if (values.followers) metrics.followers = toInt(values.followers);
  if (values.engagementRate) metrics.engagementRate = Number(values.engagementRate);
  if (values.averageReach) metrics.averageReach = toInt(values.averageReach);
  return {
    displayName: values.displayName,
    ...(values.niche ? { niche: values.niche } : {}),
    ...(values.location ? { location: values.location } : {}),
    ...(values.bio ? { bio: values.bio } : {}),
    socialLinks: socialLinksPayload(values.socials),
    metrics,
  };
}

export function brandPayload(values: BrandProfileValues) {
  return {
    companyName: values.companyName,
    ...(values.website ? { website: values.website } : {}),
    ...(values.logo ? { logo: values.logo } : {}),
    ...(values.industry ? { industry: values.industry } : {}),
    ...(values.companySize ? { companySize: values.companySize } : {}),
    ...(values.description ? { description: values.description } : {}),
  };
}
