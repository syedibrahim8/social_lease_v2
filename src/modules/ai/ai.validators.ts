import { z } from 'zod';
import { ASSET_TYPES, PLATFORMS } from '@/modules/campaigns/campaign.types';

/** Engagement rate is a percentage (e.g. 3.5 = 3.5%). */
const engagementRate = z.number().min(0).max(100);

// Service 1 — Creator Recommendation (input = campaign details).
export const recommendationSchema = z
  .object({
    niche: z.string().trim().min(1).max(80).optional(),
    platform: z.enum(PLATFORMS).optional(),
    assetType: z.enum(ASSET_TYPES).optional(),
    minFollowers: z.number().int().nonnegative().optional(),
    limit: z.number().int().positive().max(50).optional(),
  })
  .strict();

// Service 2 — Campaign Brief (input = product description).
export const campaignBriefSchema = z
  .object({
    productDescription: z.string().trim().min(10).max(4000),
    productName: z.string().trim().max(160).optional(),
    brandName: z.string().trim().max(160).optional(),
    goals: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
    targetAudience: z.string().trim().max(400).optional(),
    platform: z.enum(PLATFORMS).optional(),
    budget: z.string().trim().max(120).optional(),
  })
  .strict();

// Service 3 — Pricing Recommendation.
export const pricingSchema = z
  .object({
    platform: z.enum(PLATFORMS),
    followers: z.number().int().nonnegative(),
    engagementRate,
    assetType: z.string().trim().min(1).max(60),
    currency: z.string().trim().length(3).toUpperCase().optional(),
  })
  .strict();

// Service 4 — Fraud Detection.
export const fraudSchema = z
  .object({
    followers: z.number().int().nonnegative(),
    engagementRate,
    avgLikes: z.number().int().nonnegative().optional(),
    avgComments: z.number().int().nonnegative().optional(),
    /** Chronological follower counts (oldest→newest) for growth analysis. */
    followerHistory: z.array(z.number().int().nonnegative()).max(52).optional(),
    accountAgeDays: z.number().int().nonnegative().optional(),
  })
  .strict();

export type RecommendationInput = z.infer<typeof recommendationSchema>;
export type CampaignBriefInput = z.infer<typeof campaignBriefSchema>;
export type PricingInput = z.infer<typeof pricingSchema>;
export type FraudInput = z.infer<typeof fraudSchema>;
