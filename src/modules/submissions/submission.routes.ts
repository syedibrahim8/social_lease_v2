import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { submissionController } from '@/modules/submissions/submission.controller';
import {
  createSubmissionSchema,
  reviewSubmissionSchema,
  listSubmissionsQuerySchema,
  submissionIdParamsSchema,
  contractIdParamsSchema,
} from '@/modules/submissions/submission.validators';

/**
 * Submission routes, mounted at `${API_PREFIX}/submissions`.
 *
 * Creator submits proof + lists own work; brand lists received + reviews
 * (approve / request-revision). Reads are party-scoped (404 to non-parties).
 * `/mine`, `/received` and `/contract/:contractId` are declared before `/:id`.
 */
const router = Router();

// Creator: submit proof of work + view own submissions.
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

// Brand review actions.
router.post(
  '/:id/approve',
  authenticate,
  authorize('BRAND'),
  validate({ params: submissionIdParamsSchema }),
  submissionController.approve
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
