import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { assetController } from '@/modules/assets/asset.controller';
import {
  assetIdParamsSchema,
  availabilityBlockSchema,
  blockParamsSchema,
  createAssetSchema,
  listAssetsQuerySchema,
  updateAssetSchema,
} from '@/modules/assets/asset.validators';

/**
 * Asset marketplace routes, mounted at `${API_PREFIX}/assets`.
 *
 * Browsing/reads are open to any authenticated user; create/update/delete and
 * the availability calendar are CREATOR-only and ownership-checked in the service
 * (per-asset, like campaigns). `/mine` and `/analytics` are declared before `/:id`.
 */
const router = Router();

router.get('/', authenticate, validate({ query: listAssetsQuerySchema }), assetController.browse);
router.post(
  '/',
  authenticate,
  authorize('CREATOR'),
  validate({ body: createAssetSchema }),
  assetController.create
);

router.get(
  '/mine',
  authenticate,
  authorize('CREATOR'),
  validate({ query: listAssetsQuerySchema }),
  assetController.listMine
);
router.get('/analytics', authenticate, authorize('CREATOR'), assetController.analytics);

router.get(
  '/:id',
  authenticate,
  validate({ params: assetIdParamsSchema }),
  assetController.getById
);
router.patch(
  '/:id',
  authenticate,
  authorize('CREATOR'),
  validate({ params: assetIdParamsSchema, body: updateAssetSchema }),
  assetController.update
);
router.delete(
  '/:id',
  authenticate,
  authorize('CREATOR'),
  validate({ params: assetIdParamsSchema }),
  assetController.remove
);

// Availability calendar.
router.get(
  '/:id/availability',
  authenticate,
  validate({ params: assetIdParamsSchema }),
  assetController.getAvailability
);
router.post(
  '/:id/availability/blocks',
  authenticate,
  authorize('CREATOR'),
  validate({ params: assetIdParamsSchema, body: availabilityBlockSchema }),
  assetController.addBlock
);
router.delete(
  '/:id/availability/blocks/:blockId',
  authenticate,
  authorize('CREATOR'),
  validate({ params: blockParamsSchema }),
  assetController.removeBlock
);

export { router as assetRouter };
