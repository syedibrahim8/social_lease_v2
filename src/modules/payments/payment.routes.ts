import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { paymentController } from '@/modules/payments/payment.controller';
import {
  contractIdParamsSchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
} from '@/modules/payments/payment.validators';

/**
 * Payment routes, mounted at `${API_PREFIX}/payments`.
 *
 * NOTE: the webhook (`POST /payments/webhook`) is NOT here — it is mounted in
 * `app.ts` with `express.raw` ahead of the JSON parser so signatures verify.
 *
 * Onboarding/wallet/transactions are CREATOR-only; checkout/release/refund are
 * BRAND-only (and ownership-checked in the service). Reads are party-scoped.
 */
const router = Router();

// Creator Stripe Connect onboarding + payout wallet.
router.post('/connect/onboard', authenticate, authorize('CREATOR'), paymentController.onboard);
router.get('/connect/status', authenticate, authorize('CREATOR'), paymentController.connectStatus);
router.get('/wallet', authenticate, authorize('CREATOR'), paymentController.wallet);
router.get(
  '/transactions',
  authenticate,
  authorize('CREATOR'),
  validate({ query: listPaymentsQuerySchema }),
  paymentController.transactions
);

// Brand actions on a contract's payment.
router.post(
  '/contracts/:contractId/checkout',
  authenticate,
  authorize('BRAND'),
  validate({ params: contractIdParamsSchema }),
  paymentController.checkout
);
router.post(
  '/contracts/:contractId/release',
  authenticate,
  authorize('BRAND'),
  validate({ params: contractIdParamsSchema }),
  paymentController.release
);
router.post(
  '/contracts/:contractId/refund',
  authenticate,
  authorize('BRAND'),
  validate({ params: contractIdParamsSchema }),
  paymentController.refund
);

// Payment records (party-scoped).
router.get('/', authenticate, validate({ query: listPaymentsQuerySchema }), paymentController.list);
router.get(
  '/:id',
  authenticate,
  validate({ params: paymentIdParamsSchema }),
  paymentController.getById
);

export { router as paymentRouter };
