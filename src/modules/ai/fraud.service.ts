import { aiProvider } from '@/modules/ai/ai.provider';
import type { FraudResult, FraudSignal, Severity } from '@/modules/ai/ai.types';
import type { FraudInput } from '@/modules/ai/ai.validators';

const SEVERITY_WEIGHT: Record<Severity, number> = { LOW: 10, MEDIUM: 22, HIGH: 40 };

/** Largest single-period follower jump in the history (as a fraction). */
function maxPeriodGrowth(history?: number[]): number {
  if (!history || history.length < 2) return 0;
  let max = 0;
  for (let i = 1; i < history.length; i += 1) {
    const prev = history[i - 1] ?? 0;
    const curr = history[i] ?? 0;
    if (prev > 0) max = Math.max(max, (curr - prev) / prev);
  }
  return max;
}

/**
 * Fraud Detection.
 *
 * Deterministic heuristics over account metrics — fast, explainable, and reliable
 * (each flag returns a concrete reason). Detects fake followers (engagement far
 * too low for the audience), suspicious engagement (implausibly high / skewed
 * like:comment), and unusual growth (sudden follower spikes / impossible age).
 * OpenAI optionally adds a measured risk summary.
 */
export const fraudService = {
  async detect(input: FraudInput): Promise<FraudResult> {
    const signals: FraudSignal[] = [];
    const { followers, engagementRate: er } = input;

    // Fake followers — engagement implausibly low for the audience size.
    if (followers >= 50000 && er < 0.5) {
      signals.push({
        type: 'FAKE_FOLLOWERS',
        severity: 'HIGH',
        detail: `Engagement ${er}% is implausibly low for ${followers.toLocaleString()} followers`,
      });
    } else if (followers >= 10000 && er < 1) {
      signals.push({
        type: 'FAKE_FOLLOWERS',
        severity: 'MEDIUM',
        detail: `Engagement ${er}% is low for ${followers.toLocaleString()} followers`,
      });
    }

    // Suspicious engagement — implausibly high or skewed like:comment ratio.
    if (er > 20) {
      signals.push({
        type: 'SUSPICIOUS_ENGAGEMENT',
        severity: 'HIGH',
        detail: `Engagement ${er}% is abnormally high`,
      });
    } else if (er > 12) {
      signals.push({
        type: 'SUSPICIOUS_ENGAGEMENT',
        severity: 'MEDIUM',
        detail: `Engagement ${er}% is unusually high`,
      });
    }
    if (input.avgLikes !== undefined && input.avgComments !== undefined) {
      if (input.avgComments === 0 && input.avgLikes > 500) {
        signals.push({
          type: 'SUSPICIOUS_ENGAGEMENT',
          severity: 'MEDIUM',
          detail: 'High like count with effectively zero comments',
        });
      } else if (input.avgComments > 0 && input.avgLikes / input.avgComments > 1000) {
        signals.push({
          type: 'SUSPICIOUS_ENGAGEMENT',
          severity: 'LOW',
          detail: 'Like-to-comment ratio is very high',
        });
      }
    }

    // Unusual growth — sudden follower spike, or impossible volume for the age.
    const spike = maxPeriodGrowth(input.followerHistory);
    if (spike >= 0.5) {
      signals.push({
        type: 'UNUSUAL_GROWTH',
        severity: 'HIGH',
        detail: `A single period shows ${Math.round(spike * 100)}% follower growth`,
      });
    } else if (spike >= 0.25) {
      signals.push({
        type: 'UNUSUAL_GROWTH',
        severity: 'MEDIUM',
        detail: `A single period shows ${Math.round(spike * 100)}% follower growth`,
      });
    }
    if (input.accountAgeDays !== undefined && input.accountAgeDays < 90 && followers > 100000) {
      signals.push({
        type: 'UNUSUAL_GROWTH',
        severity: 'HIGH',
        detail: `${followers.toLocaleString()} followers on an account only ${input.accountAgeDays} days old`,
      });
    }

    const riskScore = Math.min(
      100,
      signals.reduce((sum, s) => sum + SEVERITY_WEIGHT[s.severity], 0)
    );
    let riskLevel: Severity = 'LOW';
    if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 30) riskLevel = 'MEDIUM';

    const result: FraudResult = { riskScore, riskLevel, signals };

    const summary = await aiProvider.tryInsight(
      'You are a trust & safety analyst. In 1-2 measured sentences, summarise the fraud risk for this account from the signals.',
      `Inputs: ${JSON.stringify(input)}\nResult: ${JSON.stringify(result)}`
    );
    if (summary) result.summary = summary;

    return result;
  },
};

export type FraudService = typeof fraudService;
