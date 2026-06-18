import { z } from 'zod';
import {
  VERIFICATION_REQUEST_STATUSES,
  VERIFICATION_TYPES,
} from '@/modules/verifications/verification.types';

/**
 * Verification validation schemas. The submit body is `.strict()` (server-owned
 * fields like `status`/`reviewedBy` are rejected) and `.superRefine`d so the
 * evidence required for each verification type is present.
 */
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const evidenceSchema = z
  .object({
    profileUrl: z.string().trim().url().max(2048).optional(),
    handle: z.string().trim().max(120).optional(),
    businessEmail: z.string().trim().toLowerCase().email().max(254).optional(),
    documents: z.array(z.string().trim().url().max(2048)).max(10).optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export const submitVerificationSchema = z
  .object({
    verificationType: z.enum(VERIFICATION_TYPES),
    evidence: evidenceSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    const { verificationType: type, evidence } = val;
    const fail = (path: string, message: string): void => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['evidence', path], message });
    };
    switch (type) {
      case 'SOCIAL_PROFILE':
      case 'PROFILE_OWNERSHIP':
      case 'WEBSITE':
        if (!evidence.profileUrl)
          fail('profileUrl', 'profileUrl is required for this verification');
        break;
      case 'BUSINESS_EMAIL':
        if (!evidence.businessEmail) {
          fail('businessEmail', 'businessEmail is required for this verification');
        }
        break;
      case 'IDENTITY':
      case 'COMPANY':
        if ((evidence.documents?.length ?? 0) === 0) {
          fail('documents', 'at least one document is required for this verification');
        }
        break;
    }
  });

export const approveVerificationSchema = z
  .object({ reviewNote: z.string().trim().max(1000).optional() })
  .strict();

export const rejectVerificationSchema = z
  .object({ reviewNote: z.string().trim().min(1, 'A reason is required').max(1000) })
  .strict();

export const listVerificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(VERIFICATION_REQUEST_STATUSES).optional(),
  role: z.enum(['CREATOR', 'BRAND']).optional(),
  verificationType: z.enum(VERIFICATION_TYPES).optional(),
  userId: objectId.optional(),
});

export const listMineQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(VERIFICATION_REQUEST_STATUSES).optional(),
  verificationType: z.enum(VERIFICATION_TYPES).optional(),
});

export const verificationIdParamsSchema = z.object({ id: objectId });

export type SubmitVerificationDto = z.infer<typeof submitVerificationSchema>;
export type ApproveVerificationDto = z.infer<typeof approveVerificationSchema>;
export type RejectVerificationDto = z.infer<typeof rejectVerificationSchema>;
export type ListVerificationsQuery = z.infer<typeof listVerificationsQuerySchema>;
export type ListMineQuery = z.infer<typeof listMineQuerySchema>;
