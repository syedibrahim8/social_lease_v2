import { aiProvider } from '@/modules/ai/ai.provider';
import type { PricingResult } from '@/modules/ai/ai.types';
import type { PricingInput } from '@/modules/ai/ai.validators';

/** Baseline rate in minor units (cents) per 1,000 followers, by platform. */
const PLATFORM_RATE: Record<string, number> = {
  INSTAGRAM: 1000,
  YOUTUBE: 2500,
  TIKTOK: 800,
  LINKEDIN: 1500,
  TWITTER: 700,
  FACEBOOK: 600,
  OTHER: 500,
};

/** Asset-type effort/value multipliers (substring matched, case-insensitive). */
const ASSET_MULTIPLIERS: ReadonlyArray<{ match: string; mult: number }> = [
  { match: 'video', mult: 2 },
  { match: 'reel', mult: 1.3 },
  { match: 'short', mult: 1.2 },
  { match: 'thread', mult: 1.1 },
  { match: 'post', mult: 1 },
  { match: 'story', mult: 0.6 },
  { match: 'banner', mult: 0.5 },
  { match: 'header', mult: 0.5 },
  { match: 'bio', mult: 0.4 },
  { match: 'mention', mult: 0.4 },
];

const ENGAGEMENT_BASELINE = 3; // % — average engagement maps to a 1.0 multiplier.

function assetMultiplier(assetType: string): number {
  const a = assetType.toLowerCase();
  for (const { match, mult } of ASSET_MULTIPLIERS) {
    if (a.includes(match)) return mult;
  }
  return 1;
}

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
    const baseRate = PLATFORM_RATE[input.platform] ?? 500;
    const assetMult = assetMultiplier(input.assetType);
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
