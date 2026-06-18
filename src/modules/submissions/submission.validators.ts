import { z } from 'zod';
import { DELIVERY_FILE_TYPES, SUBMISSION_STATUSES } from '@/modules/submissions/submission.types';

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

const fileSchema = z
  .object({
    type: z.enum(DELIVERY_FILE_TYPES),
    url: z.string().trim().url().max(2048),
    caption: z.string().trim().max(200).optional(),
  })
  .strict();

const linkSchema = z
  .object({
    url: z.string().trim().url().max(2048),
    label: z.string().trim().max(120).optional(),
  })
  .strict();

/**
 * Upload proof (create a DRAFT delivery). Server-owned fields (status/revision/
 * parties/asset) are derived from the contract, so the body is `.strict()`. A
 * draft may be incomplete — proof (≥1 file or link) is required at SUBMIT time.
 */
export const createSubmissionSchema = z
  .object({
    contractId: objectId,
    files: z.array(fileSchema).max(20).optional(),
    links: z.array(linkSchema).max(20).optional(),
    note: z.string().trim().max(1000).optional(),
    analytics: analyticsSchema.optional(),
  })
  .strict();

/** Update proof — edit a DRAFT / REVISION_REQUESTED delivery. */
export const updateSubmissionSchema = z
  .object({
    files: z.array(fileSchema).max(20).optional(),
    links: z.array(linkSchema).max(20).optional(),
    note: z.string().trim().max(1000).optional(),
    analytics: analyticsSchema.optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

/** Brand review note for reject / request-revision. */
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
export type UpdateSubmissionDto = z.infer<typeof updateSubmissionSchema>;
export type ReviewSubmissionDto = z.infer<typeof reviewSubmissionSchema>;
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
