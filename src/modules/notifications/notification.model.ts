import { Schema, model } from 'mongoose';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type INotificationDocument,
  type INotificationModel,
  type INotificationPreferenceDocument,
  type INotificationPreferenceModel,
} from '@/modules/notifications/notification.types';

const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: unknown, ret: Record<string, unknown>) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    return ret;
  },
};

const notificationSchema = new Schema<INotificationDocument, INotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    data: { type: Schema.Types.Mixed },
    channels: { type: [{ type: String, enum: NOTIFICATION_CHANNELS }], default: [] },
    read: { type: Boolean, default: false, required: true },
    readAt: { type: Date },
  },
  { timestamps: true, toJSON }
);

// The hot path: a user's notifications newest-first, and their unread count.
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const notificationPreferenceSchema = new Schema<
  INotificationPreferenceDocument,
  INotificationPreferenceModel
>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    inAppEnabled: { type: Boolean, default: true, required: true },
    emailEnabled: { type: Boolean, default: true, required: true },
    mutedInApp: { type: [{ type: String, enum: NOTIFICATION_TYPES }], default: [] },
    mutedEmail: { type: [{ type: String, enum: NOTIFICATION_TYPES }], default: [] },
  },
  { timestamps: true, toJSON }
);

export const NotificationModel = model<INotificationDocument, INotificationModel>(
  'Notification',
  notificationSchema
);

export const NotificationPreferenceModel = model<
  INotificationPreferenceDocument,
  INotificationPreferenceModel
>('NotificationPreference', notificationPreferenceSchema);
