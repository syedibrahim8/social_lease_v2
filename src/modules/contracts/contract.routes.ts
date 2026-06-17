import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { validate } from '@/middleware/validate.middleware';
import { contractController } from '@/modules/contracts/contract.controller';
import {
  listContractsQuerySchema,
  contractIdParamsSchema,
} from '@/modules/contracts/contract.validators';

/**
 * Contract routes, mounted at `${API_PREFIX}/contracts`.
 *
 * Contracts are auto-generated on agreement — there is no create endpoint. Both
 * parties (brand + creator) can read their own contracts and cancel before
 * funding; the service enforces party membership.
 */
const router = Router();

router.get(
  '/',
  authenticate,
  validate({ query: listContractsQuerySchema }),
  contractController.list
);

router.get(
  '/:id',
  authenticate,
  validate({ params: contractIdParamsSchema }),
  contractController.getById
);

router.post(
  '/:id/cancel',
  authenticate,
  validate({ params: contractIdParamsSchema }),
  contractController.cancel
);

export { router as contractRouter };
