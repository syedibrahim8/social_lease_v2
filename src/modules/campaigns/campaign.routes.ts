import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { campaignController } from '@/modules/campaigns/campaign.controller';
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignsQuerySchema,
  campaignIdParamsSchema,
} from '@/modules/campaigns/campaign.validators';

/**
 * Campaign routes, mounted at `${API_PREFIX}/campaigns`.
 *
 * `/mine` is declared BEFORE `/:id`. Only BRANDs create/manage campaigns;
 * ownership is enforced per-campaign in the service. Reads are open to any
 * authenticated user (creators browse the marketplace), but DRAFTs are visible
 * only to their owner.
 */
const router = Router();

// Browse published campaigns (any authenticated user).
router.get(
  '/',
  authenticate,
  validate({ query: listCampaignsQuerySchema }),
  campaignController.list
);

// The calling brand's own campaigns (all statuses).
router.get(
  '/mine',
  authenticate,
  authorize('BRAND'),
  validate({ query: listCampaignsQuerySchema }),
  campaignController.listMine
);

// Create (BRAND).
router.post(
  '/',
  authenticate,
  authorize('BRAND'),
  validate({ body: createCampaignSchema }),
  campaignController.create
);

// Single campaign (owner sees drafts; others only published).
router.get(
  '/:id',
  authenticate,
  validate({ params: campaignIdParamsSchema }),
  campaignController.getById
);

// Manage own campaign (BRAND + ownership checked in service).
router.patch(
  '/:id',
  authenticate,
  authorize('BRAND'),
  validate({ params: campaignIdParamsSchema, body: updateCampaignSchema }),
  campaignController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('BRAND'),
  validate({ params: campaignIdParamsSchema }),
  campaignController.remove
);
router.post(
  '/:id/publish',
  authenticate,
  authorize('BRAND'),
  validate({ params: campaignIdParamsSchema }),
  campaignController.publish
);

export { router as campaignRouter };
