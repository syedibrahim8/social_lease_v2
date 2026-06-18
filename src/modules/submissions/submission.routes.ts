import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { submissionController } from '@/modules/submissions/submission.controller';
import {
  createSubmissionSchema,
  updateSubmissionSchema,
  reviewSubmissionSchema,
  listSubmissionsQuerySchema,
  submissionIdParamsSchema,
  contractIdParamsSchema,
} from '@/modules/submissions/submission.validators';

/**
 * Campaign delivery (proof-of-work) routes, mounted at `${API_PREFIX}/submissions`.
 *
 * Creator uploads proof (DRAFT) → updates → submits for review; brand reviews
 * (approve / reject / request-revision). Reads are party-scoped (404 to
 * non-parties; brand can't see a creator's DRAFT). `/mine`, `/received` and
 * `/contract/:contractId` are declared before `/:id`.
 */
const router = Router();

// Creator: upload proof (draft) + view own deliveries.
router.post(
  '/',
  authenticate,
  authorize('CREATOR'),
  validate({ body: createSubmissionSchema }),
  submissionController.create
);
router.get(
  '/mine',
  authenticate,
  authorize('CREATOR'),
  validate({ query: listSubmissionsQuerySchema }),
  submissionController.listMine
);

// Brand: submissions received across their contracts.
router.get(
  '/received',
  authenticate,
  authorize('BRAND'),
  validate({ query: listSubmissionsQuerySchema }),
  submissionController.listReceived
);

// Party-scoped: full submission history for a contract.
router.get(
  '/contract/:contractId',
  authenticate,
  validate({ params: contractIdParamsSchema, query: listSubmissionsQuerySchema }),
  submissionController.listForContract
);

// Creator: update a draft + submit it for review.
router.patch(
  '/:id',
  authenticate,
  authorize('CREATOR'),
  validate({ params: submissionIdParamsSchema, body: updateSubmissionSchema }),
  submissionController.update
);
router.post(
  '/:id/submit',
  authenticate,
  authorize('CREATOR'),
  validate({ params: submissionIdParamsSchema }),
  submissionController.submit
);

// Brand review actions.
router.post(
  '/:id/approve',
  authenticate,
  authorize('BRAND'),
  validate({ params: submissionIdParamsSchema }),
  submissionController.approve
);
router.post(
  '/:id/reject',
  authenticate,
  authorize('BRAND'),
  validate({ params: submissionIdParamsSchema, body: reviewSubmissionSchema }),
  submissionController.reject
);
router.post(
  '/:id/request-revision',
  authenticate,
  authorize('BRAND'),
  validate({ params: submissionIdParamsSchema, body: reviewSubmissionSchema }),
  submissionController.requestRevision
);

// Party-scoped read by id.
router.get(
  '/:id',
  authenticate,
  validate({ params: submissionIdParamsSchema }),
  submissionController.getById
);

export { router as submissionRouter };
