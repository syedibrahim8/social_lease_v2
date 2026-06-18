import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import { validate } from '@/middleware/validate.middleware';
import { notificationController } from '@/modules/notifications/notification.controller';
import {
  broadcastSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
  updatePreferencesSchema,
} from '@/modules/notifications/notification.validators';

/**
 * Notification routes, mounted at `${API_PREFIX}/notifications`.
 *
 * Everything is per-authenticated-user except `POST /broadcast` (ADMIN). Literal
 * routes (`/unread-count`, `/stream`, `/read-all`, `/preferences`, `/broadcast`)
 * are declared before `/:id`.
 */
const router = Router();

router.get(
  '/',
  authenticate,
  validate({ query: listNotificationsQuerySchema }),
  notificationController.list
);
router.get('/unread-count', authenticate, notificationController.unreadCount);

// Real-time SSE stream.
router.get('/stream', authenticate, notificationController.stream);

// Preferences.
router.get('/preferences', authenticate, notificationController.getPreferences);
router.patch(
  '/preferences',
  authenticate,
  validate({ body: updatePreferencesSchema }),
  notificationController.updatePreferences
);

// Bulk mark-all-read.
router.post('/read-all', authenticate, notificationController.markAllRead);

// Admin bulk/broadcast.
router.post(
  '/broadcast',
  authenticate,
  authorize('ADMIN'),
  validate({ body: broadcastSchema }),
  notificationController.broadcast
);

// Per-notification actions.
router.patch(
  '/:id/read',
  authenticate,
  validate({ params: notificationIdParamsSchema }),
  notificationController.markRead
);
router.delete(
  '/:id',
  authenticate,
  validate({ params: notificationIdParamsSchema }),
  notificationController.remove
);

export { router as notificationRouter };
