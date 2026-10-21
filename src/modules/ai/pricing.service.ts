import { aiProvider } from '@/modules/ai/ai.provider';
import type { AssetType, Platform } from '@/types/assets';
import type { PricingResult } from '@/modules/ai/ai.types';
import type { PricingInput } from '@/modules/ai/ai.validators';

/** Baseline rate in minor units (cents) per 1,000 followers, by platform. */
const PLATFORM_RATE: Record<Platform, number> = {
  INSTAGRAM: 1000,
  YOUTUBE: 2500,
  TIKTOK: 800,
  LINKEDIN: 1500,
  TWITTER: 700,
  FACEBOOK: 600,
  THREADS: 600,
  PINTEREST: 700,
  SNAPCHAT: 600,
  TWITCH: 1800,
  OTHER: 500,
};

/**
 * Effort/value multiplier per asset type. A typed map rather than substring
 * matching, so every type in the shared catalogue has a deliberate price and a
 * new type can't be added without one (the compiler insists).
 */
const ASSET_MULTIPLIER: Record<AssetType, number> = {
  LINKEDIN_BANNER: 0.5,
  LINKEDIN_FEATURED_POST: 0.8,
  X_HEADER: 0.5,
  X_PINNED_POST: 0.7,
  INSTAGRAM_BIO_LINK: 0.4,
  INSTAGRAM_PINNED_POST: 0.8,
  YOUTUBE_CHANNEL_BANNER: 0.5,
  TIKTOK_BIO_LINK: 0.4,
  TIKTOK_PINNED_VIDEO: 1.1,
  FACEBOOK_COVER: 0.5,
  THREADS_PINNED_POST: 0.6,
  PINTEREST_BOARD: 0.7,
  TWITCH_PANEL: 0.5,
  INSTAGRAM_POST: 1,
  INSTAGRAM_CAROUSEL: 1.2,
  INSTAGRAM_REEL: 1.3,
  INSTAGRAM_STORY: 0.6,
  YOUTUBE_VIDEO: 2,
  YOUTUBE_SHORT: 1.2,
  YOUTUBE_VLOG: 1.6,
  LINKEDIN_POST: 1,
  X_POST: 0.8,
  X_THREAD: 1.1,
  TIKTOK_VIDEO: 1.3,
  FACEBOOK_POST: 0.8,
  FACEBOOK_REEL: 1.1,
  FACEBOOK_STORY: 0.5,
  THREADS_POST: 0.7,
  PINTEREST_PIN: 0.8,
  SNAPCHAT_STORY: 0.6,
  SNAPCHAT_SPOTLIGHT: 1,
  TWITCH_STREAM_MENTION: 1.2,
  PRODUCT_REVIEW: 1.4,
  TESTIMONIAL_VIDEO: 1.5,
  PRODUCT_DEMO: 1.6,
  UNBOXING_VIDEO: 1.4,
};

const ENGAGEMENT_BASELINE = 3; // % — average engagement maps to a 1.0 multiplier.

/**
 * Pricing Recommendation.
 *
 * A transparent CPM-style formula: platform baseline × asset multiplier ×
 * follower volume × engagement multiplier. Deterministic and explainable (every
 * factor is returned in the breakdown); OpenAI optionally adds a short rationale.
 */
export const pricingService = {
  async recommend(input: PricingInput): Promise<PricingResult> {
    const currency = input.currency ?? 'USD';
    const baseRate = PLATFORM_RATE[input.platform];
    const assetMult = ASSET_MULTIPLIER[input.assetType];
    const engagementMult = Math.max(0.5, Math.min(2.5, input.engagementRate / ENGAGEMENT_BASELINE));
    const ratePerThousand = Math.round(baseRate * assetMult);

    const base = (input.followers / 1000) * ratePerThousand * engagementMult;
    const suggested = Math.max(500, Math.round(base)); // floor of $5.00

    const result: PricingResult = {
      currency,
      min: Math.round(suggested * 0.8),
      suggested,
      max: Math.round(suggested * 1.3),
      breakdown: {
        ratePerThousandFollowers: ratePerThousand,
        followerVolume: input.followers,
        engagementMultiplier: Math.round(engagementMult * 100) / 100,
        assetMultiplier: assetMult,
      },
    };

    const rationale = await aiProvider.tryInsight(
      'You are a pricing analyst for influencer marketing. In 1-2 sentences, justify this suggested price range concretely.',
      `Inputs: ${JSON.stringify(input)}\nComputed (minor units): ${JSON.stringify(result)}`
    );
    if (rationale) result.rationale = rationale;

    return result;
  },
};

export type PricingService = typeof pricingService;
