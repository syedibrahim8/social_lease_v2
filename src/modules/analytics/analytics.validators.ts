import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/** Admins may scope a creator/brand dashboard to a specific user. */
export const analyticsUserQuerySchema = z.object({
  userId: objectId.optional(),
});

export type AnalyticsUserQuery = z.infer<typeof analyticsUserQuerySchema>;
