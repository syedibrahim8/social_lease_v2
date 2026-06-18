import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';
import { resolvePagination, buildPaginationMeta, type Paginated } from '@/utils/pagination';
import { userRepository } from '@/modules/users/user.repository';
import { emailService } from '@/modules/notifications/email.service';
import { notificationStream } from '@/modules/notifications/notification.stream';
import {
  notificationPreferenceRepository,
  notificationRepository,
  type NotificationFilter,
} from '@/modules/notifications/notification.repository';
import type {
  INotificationDocument,
  INotificationPreferenceDocument,
  NotificationChannel,
  NotificationType,
} from '@/modules/notifications/notification.types';
import type {
  BroadcastDto,
  ListNotificationsQuery,
  UpdatePreferencesDto,
} from '@/modules/notifications/notification.validators';

/** Content a producer hands the notification service (channel-agnostic). */
export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** App-relative path turned into the email CTA + in-app deep link. */
  actionPath?: string;
}

export const notificationService = {
  /**
   * Deliver one notification to one user across their enabled channels. Persists
   * an in-app record (+ pushes it over SSE) when in-app is on; sends an email when
   * email is on. Respects per-type mutes. Never throws on the email path.
   */
  async createForUser(
    userId: string,
    type: NotificationType,
    content: NotificationContent
  ): Promise<INotificationDocument | null> {
    const prefs = await notificationPreferenceRepository.ensureForUser(userId);
    const wantInApp = prefs.inAppEnabled && !prefs.mutedInApp.includes(type);
    const wantEmail = prefs.emailEnabled && !prefs.mutedEmail.includes(type);

    const channels: NotificationChannel[] = [];
    if (wantInApp) channels.push('IN_APP');
    if (wantEmail) channels.push('EMAIL');
    if (channels.length === 0) return null;

    let notification: INotificationDocument | null = null;
    if (wantInApp) {
      notification = await notificationRepository.create({
        userId,
        type,
        title: content.title,
        body: content.body,
        channels,
        data: content.data,
      });
      notificationStream.publishToUser(userId, notification.toJSON());
    }

    if (wantEmail) {
      const user = await userRepository.findById(userId);
      if (user) {
        const actionUrl = content.actionPath
          ? `${env.WEB_APP_URL}${content.actionPath}`
          : undefined;
        await emailService.sendNotification(user.email, user.name, {
          title: content.title,
          body: content.body,
          ...(actionUrl ? { actionUrl } : {}),
        });
      }
    }

    return notification;
  },

  /** Admin bulk/broadcast — send the same notification to many users. */
  async broadcast(dto: BroadcastDto): Promise<{ recipients: number }> {
    const userIds = dto.userIds ?? (dto.role ? await userRepository.findIdsByRole(dto.role) : []);
    const unique = [...new Set(userIds)];
    const content: NotificationContent = { title: dto.title, body: dto.body };
    if (dto.data) content.data = dto.data;
    if (dto.actionPath) content.actionPath = dto.actionPath;

    await Promise.all(
      unique.map((id) => this.createForUser(id, dto.type ?? 'ANNOUNCEMENT', content))
    );
    return { recipients: unique.length };
  },

  // --- reads / mutations -------------------------------------------------

  async list(
    userId: string,
    query: ListNotificationsQuery
  ): Promise<Paginated<INotificationDocument>> {
    const filter: NotificationFilter = { userId };
    if (query.type) filter.type = query.type;
    if (query.read !== undefined) filter.read = query.read;
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { items, total } = await notificationRepository.list(filter, { page, limit, skip });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await notificationRepository.countUnread(userId) };
  },

  async markRead(id: string, userId: string): Promise<INotificationDocument> {
    const updated = await notificationRepository.markRead(id, userId);
    if (!updated) {
      throw ApiError.notFound('Notification not found');
    }
    return updated;
  },

  async markAllRead(userId: string): Promise<{ updated: number }> {
    return { updated: await notificationRepository.markAllRead(userId) };
  },

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await notificationRepository.deleteOwned(id, userId);
    if (!deleted) {
      throw ApiError.notFound('Notification not found');
    }
  },

  getPreferences(userId: string): Promise<INotificationPreferenceDocument> {
    return notificationPreferenceRepository.ensureForUser(userId);
  },

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<INotificationPreferenceDocument> {
    const updated = await notificationPreferenceRepository.update(userId, dto);
    if (!updated) {
      throw ApiError.internal('Failed to update preferences');
    }
    return updated;
  },
};

export type NotificationService = typeof notificationService;
