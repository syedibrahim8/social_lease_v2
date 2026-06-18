import type { Document, Model, Types } from 'mongoose';

/**
 * Notification types — one per domain event the system surfaces, plus a generic
 * `ANNOUNCEMENT` for admin bulk/broadcast messages.
 */
export const NOTIFICATION_TYPES = [
  'CAMPAIGN_CREATED',
  'APPLICATION_RECEIVED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'PAYMENT_RECEIVED',
  'SUBMISSION_APPROVED',
  'VERIFICATION_APPROVED',
  'ANNOUNCEMENT',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Delivery channels. */
export const NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

/** A delivered (in-app) notification for one recipient. */
export interface INotification {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  /** Contextual ids for deep-linking (campaignId, applicationId, …). */
  data?: Record<string, string>;
  /** Channels this notification was actually dispatched on. */
  channels: NotificationChannel[];
  read: boolean;
  readAt?: Date;
}

export interface INotificationDocument extends INotification, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type INotificationModel = Model<INotificationDocument>;

/** Per-user delivery preferences. Defaults: everything on. */
export interface INotificationPreference {
  userId: Types.ObjectId;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  /** Types the user has muted for the in-app / email channel respectively. */
  mutedInApp: NotificationType[];
  mutedEmail: NotificationType[];
}

export interface INotificationPreferenceDocument
  extends INotificationPreference, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export type INotificationPreferenceModel = Model<INotificationPreferenceDocument>;
