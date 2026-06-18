import { z } from 'zod';
import { NOTIFICATION_TYPES } from '@/modules/notifications/notification.types';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  // Query strings arrive as 'true'/'false'.
  read: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const updatePreferencesSchema = z
  .object({
    inAppEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    mutedInApp: z.array(z.enum(NOTIFICATION_TYPES)).max(NOTIFICATION_TYPES.length).optional(),
    mutedEmail: z.array(z.enum(NOTIFICATION_TYPES)).max(NOTIFICATION_TYPES.length).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one preference to update',
  });

export const broadcastSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    body: z.string().trim().min(2).max(1000),
    type: z.enum(NOTIFICATION_TYPES).optional(),
    data: z.record(z.string(), z.string()).optional(),
    actionPath: z.string().trim().max(300).optional(),
    userIds: z.array(objectId).min(1).max(1000).optional(),
    role: z.enum(['CREATOR', 'BRAND', 'ADMIN']).optional(),
  })
  .strict()
  .refine((d) => Boolean(d.userIds) || Boolean(d.role), {
    message: 'Provide userIds or a role to target',
    path: ['userIds'],
  });

export const notificationIdParamsSchema = z.object({ id: objectId });

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
export type BroadcastDto = z.infer<typeof broadcastSchema>;
