import { z } from 'zod';
import { ASSET_TYPES, CAMPAIGN_STATUSES, PLATFORMS } from '@/modules/campaigns/campaign.types';

/**
 * Campaign validation schemas.
 *
 * Bodies are `.strict()`: `brandId`, `status`, and `publishedAt` are system
 * controlled and rejected if present in a request body. Budget amounts are
 * integers in the smallest currency unit (e.g. cents).
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const money = z.number().int('Amount must be an integer (minor units, e.g. cents)').nonnegative();

export const createCampaignSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(5000),
    assetType: z.enum(ASSET_TYPES),
    platform: z.enum(PLATFORMS),
    duration: z.number().int().positive().max(3650),
    budgetMin: money,
    budgetMax: money,
    currency: z.string().trim().length(3).toUpperCase().optional(),
    requirements: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  })
  .strict()
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'budgetMax must be greater than or equal to budgetMin',
    path: ['budgetMax'],
  });

export const updateCampaignSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(5000),
    assetType: z.enum(ASSET_TYPES),
    platform: z.enum(PLATFORMS),
    duration: z.number().int().positive().max(3650),
    budgetMin: money,
    budgetMax: money,
    currency: z.string().trim().length(3).toUpperCase(),
    requirements: z.array(z.string().trim().min(1).max(500)).max(50),
  })
  .strict()
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  })
  .refine(
    (data) =>
      data.budgetMin === undefined ||
      data.budgetMax === undefined ||
      data.budgetMax >= data.budgetMin,
    { message: 'budgetMax must be greater than or equal to budgetMin', path: ['budgetMax'] }
  );

export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  assetType: z.enum(ASSET_TYPES).optional(),
  platform: z.enum(PLATFORMS).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  minBudget: z.coerce.number().int().nonnegative().optional(),
  maxBudget: z.coerce.number().int().nonnegative().optional(),
  search: z.string().trim().max(120).optional(),
});

export const campaignIdParamsSchema = z.object({ id: objectId });

export type CreateCampaignDto = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
export type CampaignIdParams = z.infer<typeof campaignIdParamsSchema>;
