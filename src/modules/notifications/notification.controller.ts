import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { notificationService } from '@/modules/notifications/notification.service';
import { notificationStream } from '@/modules/notifications/notification.stream';
import type {
  BroadcastDto,
  UpdatePreferencesDto,
} from '@/modules/notifications/notification.validators';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Notification id is required');
  }
  return id;
}

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await notificationService.list(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Notifications fetched', meta);
  }),

  unreadCount: asyncHandler(async (req, res) => {
    const data = await notificationService.unreadCount(requireUserId(req));
    return ApiResponse.ok(res, data, 'Unread count');
  }),

  markRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, notification, 'Notification marked read');
  }),

  markAllRead: asyncHandler(async (req, res) => {
    const data = await notificationService.markAllRead(requireUserId(req));
    return ApiResponse.ok(res, data, 'All notifications marked read');
  }),

  remove: asyncHandler(async (req, res) => {
    await notificationService.remove(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, null, 'Notification deleted');
  }),

  getPreferences: asyncHandler(async (req, res) => {
    const prefs = await notificationService.getPreferences(requireUserId(req));
    return ApiResponse.ok(res, prefs, 'Notification preferences');
  }),

  updatePreferences: asyncHandler(async (req, res) => {
    const dto = req.body as UpdatePreferencesDto;
    const prefs = await notificationService.updatePreferences(requireUserId(req), dto);
    return ApiResponse.ok(res, prefs, 'Preferences updated');
  }),

  broadcast: asyncHandler(async (req, res) => {
    const data = await notificationService.broadcast(req.body as BroadcastDto);
    return ApiResponse.created(res, data, 'Notification broadcast');
  }),

  /**
   * Real-time stream (Server-Sent Events). Not wrapped in asyncHandler — it holds
   * the connection open and writes events as they arrive. `text/event-stream`
   * is non-compressible, so it flows past the compression middleware unbuffered.
   */
  stream: (req: Request, res: Response): void => {
    const userId = requireUserId(req);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');
    notificationStream.addClient(userId, res);
  },
};
