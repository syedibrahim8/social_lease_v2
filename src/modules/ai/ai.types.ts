/** Shared output types for the AI services. */

// --- Service 1: Creator Recommendation ---------------------------------

export interface RecommendationBreakdown {
  /** Each 0..1, before weighting. */
  nicheMatch: number;
  reach: number;
  engagement: number;
  previousSuccess: number;
}

export interface RankedCreator {
  creatorId: string;
  userId: string;
  displayName: string;
  niche?: string;
  followers: number;
  engagementRate: number;
  averageReach: number;
  completedCampaigns: number;
  /** 0..100 weighted composite. */
  score: number;
  breakdown: RecommendationBreakdown;
}

export interface RecommendationResult {
  total: number;
  weights: { niche: number; reach: number; engagement: number; previousSuccess: number };
  creators: RankedCreator[];
  insight?: string;
}

// --- Service 2: Campaign Brief -----------------------------------------

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
  generatedBy: 'ai' | 'template';
}

// --- Service 3: Pricing ------------------------------------------------

export interface PricingResult {
  currency: string;
  /** Minor units (cents). */
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

// --- Service 4: Fraud Detection ----------------------------------------

export const FRAUD_SIGNAL_TYPES = [
  'FAKE_FOLLOWERS',
  'SUSPICIOUS_ENGAGEMENT',
  'UNUSUAL_GROWTH',
] as const;
export type FraudSignalType = (typeof FRAUD_SIGNAL_TYPES)[number];

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FraudSignal {
  type: FraudSignalType;
  severity: Severity;
  detail: string;
}

export interface FraudResult {
  riskScore: number; // 0..100
  riskLevel: Severity;
  signals: FraudSignal[];
  summary?: string;
}
