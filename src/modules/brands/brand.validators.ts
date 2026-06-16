import { z } from 'zod';
import { COMPANY_SIZES } from '@/modules/brands/brand.types';
import { VERIFICATION_STATES } from '@/types/verification';

/**
 * Brand-profile validation schemas.
 *
 * Bodies are `.strict()`: unexpected keys (e.g. `userId`, `verifiedStatus`) are
 * REJECTED, so a brand cannot self-verify or hijack another user's company.
 * `verifiedStatus` is controlled by the system / admin only.
 */
const url = z.string().url('Must be a valid URL');
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createBrandSchema = z
  .object({
    companyName: z.string().trim().min(2).max(120),
    logo: url.optional(),
    website: url.optional(),
    industry: z.string().trim().max(80).optional(),
    companySize: z.enum(COMPANY_SIZES).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateBrandSchema = createBrandSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listBrandsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  industry: z.string().trim().optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),
  verifiedStatus: z.enum(VERIFICATION_STATES).optional(),
  search: z.string().trim().max(120).optional(),
});

export const brandIdParamsSchema = z.object({ id: objectId });

export type CreateBrandDto = z.infer<typeof createBrandSchema>;
export type UpdateBrandDto = z.infer<typeof updateBrandSchema>;
export type ListBrandsQuery = z.infer<typeof listBrandsQuerySchema>;
export type BrandIdParams = z.infer<typeof brandIdParamsSchema>;
