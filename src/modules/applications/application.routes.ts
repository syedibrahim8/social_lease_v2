import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { applicationController } from '@/modules/applications/application.controller';
import {
  applySchema,
  counterOfferSchema,
  listApplicationsQuerySchema,
  applicationIdParamsSchema,
} from '@/modules/applications/application.validators';

/**
 * Application & negotiation routes, mounted at `${API_PREFIX}/applications`.
 *
 * Apply / list-mine are CREATOR-only; list-received is BRAND-only. The
 * negotiation actions (counter/accept/reject) are open to both roles — the
 * service enforces that the caller is a participant and holds the turn. `/mine`
 * and `/received` are declared before `/:id`.
 */
const router = Router();

router.post(
  '/',
  authenticate,
  authorize('CREATOR'),
  validate({ body: applySchema }),
  applicationController.apply
);

router.get(
  '/mine',
  authenticate,
  authorize('CREATOR'),
  validate({ query: listApplicationsQuerySchema }),
  applicationController.listMine
);

router.get(
  '/received',
  authenticate,
  authorize('BRAND'),
  validate({ query: listApplicationsQuerySchema }),
  applicationController.listReceived
);

router.get(
  '/:id',
  authenticate,
  validate({ params: applicationIdParamsSchema }),
  applicationController.getById
);

router.post(
  '/:id/counter',
  authenticate,
  validate({ params: applicationIdParamsSchema, body: counterOfferSchema }),
  applicationController.counter
);
router.post(
  '/:id/accept',
  authenticate,
  validate({ params: applicationIdParamsSchema }),
  applicationController.accept
);
router.post(
  '/:id/reject',
  authenticate,
  validate({ params: applicationIdParamsSchema }),
  applicationController.reject
);
router.post(
  '/:id/withdraw',
  authenticate,
  authorize('CREATOR'),
  validate({ params: applicationIdParamsSchema }),
  applicationController.withdraw
);

export { router as applicationRouter };
