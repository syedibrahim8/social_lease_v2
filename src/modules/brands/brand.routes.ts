import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { brandController } from '@/modules/brands/brand.controller';
import {
  createBrandSchema,
  updateBrandSchema,
  listBrandsQuerySchema,
  brandIdParamsSchema,
} from '@/modules/brands/brand.validators';

/**
 * Brand routes, mounted at `${API_PREFIX}/brands`.
 *
 * `/me` routes are declared BEFORE `/:id`. Mutations are BRAND-only and act on
 * the caller's own company (ownership is structural — no edit-by-arbitrary-id
 * route). Reads are open to any authenticated user.
 */
const router = Router();

router.get('/', authenticate, validate({ query: listBrandsQuerySchema }), brandController.list);

router.post(
  '/',
  authenticate,
  authorize('BRAND'),
  validate({ body: createBrandSchema }),
  brandController.create
);
router.get('/me', authenticate, authorize('BRAND'), brandController.getMine);
router.patch(
  '/me',
  authenticate,
  authorize('BRAND'),
  validate({ body: updateBrandSchema }),
  brandController.update
);
router.delete('/me', authenticate, authorize('BRAND'), brandController.remove);

router.get(
  '/:id',
  authenticate,
  validate({ params: brandIdParamsSchema }),
  brandController.getById
);

export { router as brandRouter };
