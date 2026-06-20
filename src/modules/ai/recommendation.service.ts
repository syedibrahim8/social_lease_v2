import { creatorRepository } from '@/modules/creators/creator.repository';
import { contractRepository } from '@/modules/contracts/contract.repository';
import { aiProvider } from '@/modules/ai/ai.provider';
import type {
  RankedCreator,
  RecommendationBreakdown,
  RecommendationResult,
} from '@/modules/ai/ai.types';
import type { RecommendationInput } from '@/modules/ai/ai.validators';
import type { ICreatorProfileDocument } from '@/modules/creators/creator.types';

/** Factor weights (sum to 1). */
const WEIGHTS = { niche: 0.35, reach: 0.25, engagement: 0.25, previousSuccess: 0.15 };
const CANDIDATE_POOL = 300;
/** Engagement rate (%) that maps to a full engagement score. */
const ENGAGEMENT_CEILING = 15;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Niche affinity: exact (1) / partial (0.6) / none (0.2); neutral (0.5) if unspecified. */
function scoreNiche(target: string | undefined, creatorNiche: string | undefined): number {
  if (!target) return 0.5;
  if (!creatorNiche) return 0.2;
  const a = target.toLowerCase();
  const b = creatorNiche.toLowerCase();
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.6;
  return 0.2;
}

/**
 * Creator Recommendation Engine.
 *
 * A deterministic, explainable ranking over the real creator pool — the four
 * factors (niche match, reach, engagement, previous campaign success) are
 * normalised against the candidate pool and weighted. An LLM ranking the whole
 * table wouldn't scale or be reproducible, so OpenAI is used only for an optional
 * natural-language summary of the top matches.
 */
export const recommendationService = {
  async recommend(input: RecommendationInput): Promise<RecommendationResult> {
    const candidates = await creatorRepository.listForRecommendation(
      input.minFollowers !== undefined ? { minFollowers: input.minFollowers } : {},
      CANDIDATE_POOL
    );

    // Contracts key on the creator's USER id (not the profile _id).
    const completed = await contractRepository.countCompletedByCreators(
      candidates.map((c) => c.userId.toString())
    );

    const maxReach = Math.max(1, ...candidates.map(reachOf));
    const maxCompleted = Math.max(
      1,
      ...candidates.map((c) => completed.get(c.userId.toString()) ?? 0)
    );

    const limit = input.limit ?? 10;
    const ranked: RankedCreator[] = candidates
      .map((c) => {
        const completedCount = completed.get(c.userId.toString()) ?? 0;
        const breakdown: RecommendationBreakdown = {
          nicheMatch: scoreNiche(input.niche, c.niche),
          reach: clamp01(reachOf(c) / maxReach),
          engagement: clamp01((c.metrics?.engagementRate ?? 0) / ENGAGEMENT_CEILING),
          previousSuccess: clamp01(completedCount / maxCompleted),
        };
        const score = Math.round(
          100 *
            (WEIGHTS.niche * breakdown.nicheMatch +
              WEIGHTS.reach * breakdown.reach +
              WEIGHTS.engagement * breakdown.engagement +
              WEIGHTS.previousSuccess * breakdown.previousSuccess)
        );
        const creator: RankedCreator = {
          creatorId: c._id.toString(),
          userId: c.userId.toString(),
          displayName: c.displayName,
          followers: c.metrics?.followers ?? 0,
          engagementRate: c.metrics?.engagementRate ?? 0,
          averageReach: c.metrics?.averageReach ?? 0,
          completedCampaigns: completedCount,
          score,
          breakdown: {
            nicheMatch: round2(breakdown.nicheMatch),
            reach: round2(breakdown.reach),
            engagement: round2(breakdown.engagement),
            previousSuccess: round2(breakdown.previousSuccess),
          },
        };
        if (c.niche) creator.niche = c.niche;
        return creator;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const result: RecommendationResult = {
      total: ranked.length,
      weights: {
        niche: WEIGHTS.niche,
        reach: WEIGHTS.reach,
        engagement: WEIGHTS.engagement,
        previousSuccess: WEIGHTS.previousSuccess,
      },
      creators: ranked,
    };

    const insight = await aiProvider.tryInsight(
      'You are a marketing strategist. In 2-3 sentences, summarise why these creators fit the campaign. Be concrete and concise.',
      `Campaign: ${JSON.stringify(input)}\nTop creators: ${JSON.stringify(
        ranked.slice(0, 5).map((c) => ({
          displayName: c.displayName,
          niche: c.niche,
          followers: c.followers,
          engagementRate: c.engagementRate,
          completedCampaigns: c.completedCampaigns,
          score: c.score,
        }))
      )}`
    );
    if (insight) result.insight = insight;

    return result;
  },
};

function reachOf(c: ICreatorProfileDocument): number {
  return c.metrics?.averageReach || c.metrics?.followers || 0;
}

export type RecommendationService = typeof recommendationService;
