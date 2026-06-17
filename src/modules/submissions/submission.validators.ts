import { z } from 'zod';
import { SUBMISSION_STATUSES } from '@/modules/submissions/submission.types';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const analyticsSchema = z
  .object({
    impressions: z.number().int().nonnegative().optional(),
    reach: z.number().int().nonnegative().optional(),
    likes: z.number().int().nonnegative().optional(),
    comments: z.number().int().nonnegative().optional(),
    shares: z.number().int().nonnegative().optional(),
    saves: z.number().int().nonnegative().optional(),
  })
  .strict();

/**
 * Create a submission. Server-owned fields (status/revision/parties/asset) are
 * derived from the contract, so the body is `.strict()` to block injection.
 * Proof must contain at least a live URL or one media URL.
 */
export const createSubmissionSchema = z
  .object({
    contractId: objectId,
    note: z.string().trim().max(1000).optional(),
    liveUrl: z.string().trim().url().max(2048).optional(),
    mediaUrls: z.array(z.string().trim().url().max(2048)).max(20).optional(),
    analytics: analyticsSchema.optional(),
  })
  .strict()
  .refine((d) => Boolean(d.liveUrl) || (d.mediaUrls?.length ?? 0) > 0, {
    message: 'Provide a liveUrl or at least one media URL as proof of work',
    path: ['liveUrl'],
  });

export const reviewSubmissionSchema = z
  .object({
    reviewNote: z.string().trim().min(1).max(1000),
  })
  .strict();

export const listSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(SUBMISSION_STATUSES).optional(),
  contractId: objectId.optional(),
});

export const submissionIdParamsSchema = z.object({ id: objectId });
export const contractIdParamsSchema = z.object({ contractId: objectId });

export type CreateSubmissionDto = z.infer<typeof createSubmissionSchema>;
export type ReviewSubmissionDto = z.infer<typeof reviewSubmissionSchema>;
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
