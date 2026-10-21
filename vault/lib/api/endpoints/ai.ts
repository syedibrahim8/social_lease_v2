import { apiPost } from "@/lib/api/client";
import type { AssetType, Platform } from "@/lib/api/types";

/**
 * The AI services. Ranking, pricing and fraud scoring are deterministic,
 * explainable formulas on the backend; the optional `insight` / `rationale` /
 * `summary` text only appears when an LLM key is configured there. The brief is
 * LLM-written when available and template-built otherwise (`generatedBy`).
 */

export interface RecommendationInput {
  niche?: string;
  platform?: Platform;
  assetType?: AssetType;
  minFollowers?: number;
  limit?: number;
}

export interface RankedCreator {
  creatorId: string;
  userId: string;
  displayName: string;
  niche?: string;
  followers: number;
  /** Percent. */
  engagementRate: number;
  averageReach: number;
  completedCampaigns: number;
  /** 0–100. */
  score: number;
  /** Each factor 0–1. */
  breakdown: { nicheMatch: number; reach: number; engagement: number; previousSuccess: number };
}

export interface Recommendations {
  total: number;
  weights: { niche: number; reach: number; engagement: number; previousSuccess: number };
  creators: RankedCreator[];
  insight?: string;
}

export function getRecommendations(input: RecommendationInput): Promise<Recommendations> {
  return apiPost<Recommendations>("/ai/recommendations", input);
}

export interface BriefInput {
  productDescription: string;
  productName?: string;
  brandName?: string;
  goals?: string[];
  targetAudience?: string;
  platform?: Platform;
  budget?: string;
}

export interface CampaignBrief {
  title: string;
  overview: string;
  objectives: string[];
  targetAudience: string;
  keyMessages: string[];
  suggestedPlatforms: string[];
  contentIdeas: string[];
  deliverables: string[];
  dos: string[];
  donts: string[];
  hashtags: string[];
  callToAction: string;
  generatedBy: "ai" | "template";
}

export function generateBrief(input: BriefInput): Promise<CampaignBrief> {
  return apiPost<CampaignBrief>("/ai/campaign-brief", input);
}

export interface PricingInput {
  platform: Platform;
  assetType: AssetType;
  followers: number;
  engagementRate: number;
  currency?: string;
}

export interface PriceSuggestion {
  currency: string;
  /** Minor units. */
  min: number;
  suggested: number;
  max: number;
  breakdown: {
    ratePerThousandFollowers: number;
    followerVolume: number;
    engagementMultiplier: number;
    assetMultiplier: number;
  };
  rationale?: string;
}

export function suggestPrice(input: PricingInput): Promise<PriceSuggestion> {
  return apiPost<PriceSuggestion>("/ai/pricing", input);
}

export interface FraudInput {
  followers: number;
  engagementRate: number;
  avgLikes?: number;
  avgComments?: number;
  followerHistory?: number[];
  accountAgeDays?: number;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FraudResult {
  /** 0–100. */
  riskScore: number;
  riskLevel: RiskLevel;
  signals: {
    type: "FAKE_FOLLOWERS" | "SUSPICIOUS_ENGAGEMENT" | "UNUSUAL_GROWTH";
    severity: string;
    detail: string;
  }[];
  summary?: string;
}

export function checkFraud(input: FraudInput): Promise<FraudResult> {
  return apiPost<FraudResult>("/ai/fraud-check", input);
}
