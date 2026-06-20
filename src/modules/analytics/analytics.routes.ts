import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { analyticsController } from '@/modules/analytics/analytics.controller';
import { analyticsUserQuerySchema } from '@/modules/analytics/analytics.validators';

/**
 * Analytics dashboard routes, mounted at `${API_PREFIX}/analytics`.
 *
 * `/platform` is ADMIN-only. `/creator` and `/brand` return the caller's own
 * dashboard (by role); an ADMIN may target any user via `?userId`.
 */
const router = Router();

router.get('/platform', authenticate, authorize('ADMIN'), analyticsController.platform);

router.get(
  '/creator',
  authenticate,
  authorize('CREATOR', 'ADMIN'),
  validate({ query: analyticsUserQuerySchema }),
  analyticsController.creator
);

router.get(
  '/brand',
  authenticate,
  authorize('BRAND', 'ADMIN'),
  validate({ query: analyticsUserQuerySchema }),
  analyticsController.brand
);

export { router as analyticsRouter };
