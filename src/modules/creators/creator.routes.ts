import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { creatorController } from '@/modules/creators/creator.controller';
import {
  createCreatorSchema,
  updateCreatorSchema,
  listCreatorsQuerySchema,
  creatorIdParamsSchema,
} from '@/modules/creators/creator.validators';

/**
 * Creator routes, mounted at `${API_PREFIX}/creators`.
 *
 * `/me` routes are declared BEFORE `/:id` so "me" is never captured as an id.
 * Mutations are CREATOR-only and act on the caller's own profile (ownership is
 * structural — there is no edit-by-arbitrary-id route). Reads are open to any
 * authenticated user so brands can browse talent.
 */
const router = Router();

// Browse / search (any authenticated user).
router.get('/', authenticate, validate({ query: listCreatorsQuerySchema }), creatorController.list);

// Own profile (CREATOR only).
router.post(
  '/',
  authenticate,
  authorize('CREATOR'),
  validate({ body: createCreatorSchema }),
  creatorController.create
);
router.get('/me', authenticate, authorize('CREATOR'), creatorController.getMine);
router.patch(
  '/me',
  authenticate,
  authorize('CREATOR'),
  validate({ body: updateCreatorSchema }),
  creatorController.update
);
router.delete('/me', authenticate, authorize('CREATOR'), creatorController.remove);

// View a single profile by id (any authenticated user).
router.get(
  '/:id',
  authenticate,
  validate({ params: creatorIdParamsSchema }),
  creatorController.getById
);

export { router as creatorRouter };
