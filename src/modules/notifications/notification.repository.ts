import type { FilterQuery } from 'mongoose';
import {
  NotificationModel,
  NotificationPreferenceModel,
} from '@/modules/notifications/notification.model';
import type {
  INotificationDocument,
  INotificationPreference,
  INotificationPreferenceDocument,
  NotificationChannel,
  NotificationType,
} from '@/modules/notifications/notification.types';
import type { PageParams } from '@/utils/pagination';

type NotificationFilter = FilterQuery<INotificationDocument>;

interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channels: NotificationChannel[];
  data?: Record<string, string> | undefined;
}

type PreferencePatch = {
  [K in keyof Omit<INotificationPreference, 'userId'>]?: INotificationPreference[K] | undefined;
};

export const notificationRepository = {
  create(data: NewNotification): Promise<INotificationDocument> {
    return new NotificationModel(data).save();
  },

  findOwned(id: string, userId: string): Promise<INotificationDocument | null> {
    return NotificationModel.findOne({ _id: id, userId }).exec();
  },

  async list(
    filter: NotificationFilter,
    { skip, limit }: PageParams
  ): Promise<{ items: INotificationDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, read: false }).exec();
  },

  markRead(id: string, userId: string): Promise<INotificationDocument | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    ).exec();
  },

  /** Bulk mark-all-read; returns how many were updated. */
  async markAllRead(userId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    ).exec();
    return res.modifiedCount;
  },

  deleteOwned(id: string, userId: string): Promise<INotificationDocument | null> {
    return NotificationModel.findOneAndDelete({ _id: id, userId }).exec();
  },
};

export const notificationPreferenceRepository = {
  /** Get the user's preferences, creating defaults on first access. */
  ensureForUser(userId: string): Promise<INotificationPreferenceDocument> {
    return NotificationPreferenceModel.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .orFail()
      .exec();
  },

  update(userId: string, patch: PreferencePatch): Promise<INotificationPreferenceDocument | null> {
    return NotificationPreferenceModel.findOneAndUpdate(
      { userId },
      { $set: patch },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  },
};

export type NotificationRepository = typeof notificationRepository;
export type { NotificationFilter };
