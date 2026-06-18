import { Router } from 'express';
import { healthRouter } from '@/routes/health.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { creatorRouter } from '@/modules/creators/creator.routes';
import { brandRouter } from '@/modules/brands/brand.routes';
import { campaignRouter } from '@/modules/campaigns/campaign.routes';
import { applicationRouter } from '@/modules/applications/application.routes';
import { contractRouter } from '@/modules/contracts/contract.routes';
import { paymentRouter } from '@/modules/payments/payment.routes';
import { submissionRouter } from '@/modules/submissions/submission.routes';
import { assetRouter } from '@/modules/assets/asset.routes';
import { verificationRouter } from '@/modules/verifications/verification.routes';
import { notificationRouter } from '@/modules/notifications/notification.routes';

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
router.use('/payments', paymentRouter);
router.use('/submissions', submissionRouter);
router.use('/assets', assetRouter);
router.use('/verifications', verificationRouter);
router.use('/notifications', notificationRouter);

// Future module routers are mounted here:
// router.use('/reviews', reviewRouter);

export { router as apiRouter };
