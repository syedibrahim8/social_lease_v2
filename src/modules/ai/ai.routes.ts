import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { aiController } from '@/modules/ai/ai.controller';
import {
  campaignBriefSchema,
  fraudSchema,
  pricingSchema,
  recommendationSchema,
} from '@/modules/ai/ai.validators';

/**
 * AI Services routes, mounted at `${API_PREFIX}/ai`.
 *
 * Recommendations / brief / fraud are BRAND+ADMIN tools; pricing is open to any
 * authenticated user (creators price themselves, brands budget). All services run
 * deterministically; OpenAI enrichment activates only when `OPENAI_API_KEY` is set.
 */
const router = Router();

router.post(
  '/recommendations',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  validate({ body: recommendationSchema }),
  aiController.recommend
);

router.post(
  '/campaign-brief',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  validate({ body: campaignBriefSchema }),
  aiController.campaignBrief
);

router.post('/pricing', authenticate, validate({ body: pricingSchema }), aiController.pricing);

router.post(
  '/fraud-check',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  validate({ body: fraudSchema }),
  aiController.fraudCheck
);

export { router as aiRouter };
