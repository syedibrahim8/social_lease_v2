import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { verificationController } from '@/modules/verifications/verification.controller';
import {
  approveVerificationSchema,
  listMineQuerySchema,
  listVerificationsQuerySchema,
  rejectVerificationSchema,
  submitVerificationSchema,
  verificationIdParamsSchema,
} from '@/modules/verifications/verification.validators';

/**
 * Verification routes, mounted at `${API_PREFIX}/verifications`.
 *
 * Submit/list-mine are for CREATOR/BRAND; listing all, approve/reject and the
 * audit trail are ADMIN-only. `GET /:id` is owner-or-admin (service-checked).
 * `/mine` is declared before `/:id`.
 */
const router = Router();

router.post(
  '/',
  authenticate,
  authorize('CREATOR', 'BRAND'),
  validate({ body: submitVerificationSchema }),
  verificationController.submit
);

router.get(
  '/mine',
  authenticate,
  authorize('CREATOR', 'BRAND'),
  validate({ query: listMineQuerySchema }),
  verificationController.listMine
);

// Admin: view all requests.
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate({ query: listVerificationsQuerySchema }),
  verificationController.list
);

// Owner or admin.
router.get(
  '/:id',
  authenticate,
  validate({ params: verificationIdParamsSchema }),
  verificationController.getById
);

// Admin: manage requests + audit.
router.post(
  '/:id/approve',
  authenticate,
  authorize('ADMIN'),
  validate({ params: verificationIdParamsSchema, body: approveVerificationSchema }),
  verificationController.approve
);
router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  validate({ params: verificationIdParamsSchema, body: rejectVerificationSchema }),
  verificationController.reject
);
router.get(
  '/:id/audit',
  authenticate,
  authorize('ADMIN'),
  validate({ params: verificationIdParamsSchema }),
  verificationController.audit
);

export { router as verificationRouter };
