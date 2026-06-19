import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { recommendationService } from '@/modules/ai/recommendation.service';
import { briefService } from '@/modules/ai/brief.service';
import { pricingService } from '@/modules/ai/pricing.service';
import { fraudService } from '@/modules/ai/fraud.service';
import type {
  CampaignBriefInput,
  FraudInput,
  PricingInput,
  RecommendationInput,
} from '@/modules/ai/ai.validators';

export const aiController = {
  recommend: asyncHandler(async (req, res) => {
    const data = await recommendationService.recommend(req.body as RecommendationInput);
    return ApiResponse.ok(res, data, 'Creator recommendations');
  }),

  campaignBrief: asyncHandler(async (req, res) => {
    const data = await briefService.generate(req.body as CampaignBriefInput);
    return ApiResponse.ok(res, data, 'Campaign brief generated');
  }),

  pricing: asyncHandler(async (req, res) => {
    const data = await pricingService.recommend(req.body as PricingInput);
    return ApiResponse.ok(res, data, 'Suggested price range');
  }),

  fraudCheck: asyncHandler(async (req, res) => {
    const data = await fraudService.detect(req.body as FraudInput);
    return ApiResponse.ok(res, data, 'Fraud risk assessment');
  }),
};
