import { z } from 'zod';
import { PLATFORMS } from '@/modules/campaigns/campaign.types';
import { VERIFICATION_STATES } from '@/types/verification';
import {
  ASSET_CATEGORIES,
  AVAILABILITY_STATUSES,
  MARKETPLACE_ASSET_TYPES,
} from '@/modules/assets/asset.types';

/**
 * Asset validation schemas. Bodies are `.strict()`: `creatorId`, `category`
 * (server-derived from `assetType`), `verificationStatus`, and calendar `blocks`
 * are all system-controlled and rejected if supplied.
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const percentage = z.number().min(0).max(100);

const audienceDemographicsSchema = z
  .object({
    ageRanges: z
      .array(z.object({ range: z.string().trim().min(1).max(20), percentage }).strict())
      .max(12)
      .optional(),
    genderSplit: z
      .object({
        male: percentage.optional(),
        female: percentage.optional(),
        other: percentage.optional(),
      })
      .strict()
      .optional(),
    topCountries: z
      .array(z.object({ country: z.string().trim().min(1).max(60), percentage }).strict())
      .max(20)
      .optional(),
    topCities: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  })
  .strict();

const availabilityInputSchema = z
  .object({
    status: z.enum(AVAILABILITY_STATUSES).optional(),
    leadTimeDays: z.number().int().nonnegative().max(365).optional(),
  })
  .strict();

export const createAssetSchema = z
  .object({
    assetType: z.enum(MARKETPLACE_ASSET_TYPES),
    platform: z.enum(PLATFORMS),
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
    estimatedReach: z.number().int().nonnegative().optional(),
    averageViews: z.number().int().nonnegative().optional(),
    audienceDemographics: audienceDemographicsSchema.optional(),
    availability: availabilityInputSchema.optional(),
  })
  .strict();

export const updateAssetSchema = createAssetSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

/** Body for adding a calendar block (booked/blocked window). */
export const availabilityBlockSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    note: z.string().trim().max(280).optional(),
  })
  .strict()
  .refine((b) => b.endDate >= b.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });

export const listAssetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(160).optional(),
  category: z.enum(ASSET_CATEGORIES).optional(),
  assetType: z.enum(MARKETPLACE_ASSET_TYPES).optional(),
  platform: z.enum(PLATFORMS).optional(),
  verificationStatus: z.enum(VERIFICATION_STATES).optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
  minReach: z.coerce.number().int().nonnegative().optional(),
  minViews: z.coerce.number().int().nonnegative().optional(),
  creatorId: objectId.optional(),
});

export const assetIdParamsSchema = z.object({ id: objectId });
export const blockParamsSchema = z.object({ id: objectId, blockId: objectId });

export type CreateAssetDto = z.infer<typeof createAssetSchema>;
export type UpdateAssetDto = z.infer<typeof updateAssetSchema>;
export type AvailabilityBlockDto = z.infer<typeof availabilityBlockSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
