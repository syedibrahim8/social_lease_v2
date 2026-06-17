import { Router } from 'express';
import { healthRouter } from '@/routes/health.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { creatorRouter } from '@/modules/creators/creator.routes';
import { brandRouter } from '@/modules/brands/brand.routes';
import { campaignRouter } from '@/modules/campaigns/campaign.routes';
import { applicationRouter } from '@/modules/applications/application.routes';
import { contractRouter } from '@/modules/contracts/contract.routes';

/**
 * Root API router. Every feature module registers its router here as it is
 * built, keeping a single, readable map of the API surface. Mounted under the
 * configured API prefix in app.ts.
 */
const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/creators', creatorRouter);
router.use('/brands', brandRouter);
router.use('/campaigns', campaignRouter);
router.use('/applications', applicationRouter);
router.use('/contracts', contractRouter);

// Future module routers are mounted here:
// router.use('/payments', paymentRouter);

export { router as apiRouter };
