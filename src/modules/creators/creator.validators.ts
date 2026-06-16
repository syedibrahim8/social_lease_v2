import { z } from 'zod';
import { MEDIA_TYPES, VERIFICATION_STATES } from '@/modules/creators/creator.types';

/**
 * Creator-profile validation schemas.
 *
 * Bodies are `.strict()`: any unexpected key (e.g. `userId`, `verificationStatus`,
 * `profileOwnershipStatus`) is REJECTED. This is what guarantees a creator cannot
 * self-assign ownership/verification or hijack another user's profile via the
 * body — those fields are controlled by the system / admin only.
 */
const url = z.string().url('Must be a valid URL');
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const socialLinksSchema = z
  .object({
    linkedin: url.optional(),
    instagram: url.optional(),
    youtube: url.optional(),
    twitter: url.optional(),
    facebook: url.optional(),
  })
  .strict();

const metricsSchema = z
  .object({
    followers: z.number().int().nonnegative().optional(),
    engagementRate: z.number().min(0).max(100).optional(),
    averageReach: z.number().int().nonnegative().optional(),
  })
  .strict();

const portfolioCampaignSchema = z.object({
  title: z.string().trim().min(1).max(160),
  brandName: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  link: url.optional(),
  completedAt: z.coerce.date().optional(),
});

const mediaItemSchema = z.object({
  url,
  type: z.enum(MEDIA_TYPES),
  caption: z.string().trim().max(200).optional(),
});

export const createCreatorSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80),
    bio: z.string().trim().max(1000).optional(),
    niche: z.string().trim().max(80).optional(),
    location: z.string().trim().max(120).optional(),
    profileImage: url.optional(),
    socialLinks: socialLinksSchema.optional(),
    metrics: metricsSchema.optional(),
    previousCampaigns: z.array(portfolioCampaignSchema).max(100).optional(),
    mediaGallery: z.array(mediaItemSchema).max(100).optional(),
  })
  .strict();

export const updateCreatorSchema = createCreatorSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listCreatorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  niche: z.string().trim().optional(),
  location: z.string().trim().optional(),
  verificationStatus: z.enum(VERIFICATION_STATES).optional(),
  minFollowers: z.coerce.number().int().nonnegative().optional(),
  search: z.string().trim().max(120).optional(),
});

export const creatorIdParamsSchema = z.object({ id: objectId });

export type CreateCreatorDto = z.infer<typeof createCreatorSchema>;
export type UpdateCreatorDto = z.infer<typeof updateCreatorSchema>;
export type ListCreatorsQuery = z.infer<typeof listCreatorsQuerySchema>;
export type CreatorIdParams = z.infer<typeof creatorIdParamsSchema>;
