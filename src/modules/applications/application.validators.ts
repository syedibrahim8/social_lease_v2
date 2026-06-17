import { z } from 'zod';
import { APPLICATION_STATUSES } from '@/modules/applications/application.types';

/**
 * Application & negotiation validation schemas. Bodies are `.strict()`:
 * `creatorId`, `brandId`, `assetType`, `status`, and offer internals are all
 * system controlled and rejected if supplied.
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const money = z.number().int('Amount must be an integer (minor units, e.g. cents)').nonnegative();

export const applySchema = z
  .object({
    campaignId: objectId,
    proposal: z.string().trim().min(10).max(2000),
    proposedPrice: money,
    estimatedReach: z.number().int().nonnegative(),
  })
  .strict();

export const counterOfferSchema = z
  .object({
    amount: money,
    message: z.string().trim().max(1000).optional(),
  })
  .strict();

export const rejectSchema = z
  .object({
    message: z.string().trim().max(1000).optional(),
  })
  .strict();

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  campaignId: objectId.optional(),
});

export const applicationIdParamsSchema = z.object({ id: objectId });

export type ApplyDto = z.infer<typeof applySchema>;
export type CounterOfferDto = z.infer<typeof counterOfferSchema>;
export type RejectDto = z.infer<typeof rejectSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ApplicationIdParams = z.infer<typeof applicationIdParamsSchema>;
