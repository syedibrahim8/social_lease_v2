import { sendMail, type MailResult } from '@/config/mailer';
import {
  notificationTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
  welcomeTemplate,
  type EmailContent,
} from '@/modules/notifications/email.templates';

/**
 * High-level email API.
 *
 * One typed method per user-lifecycle state. Callers (the auth service today,
 * other modules later) express intent — "send a welcome email" — without
 * knowing about templates or transport. Adding a new email type for a future
 * module means adding a template + a method here; nothing else changes.
 *
 * All methods are non-throwing (delegating to the resilient `sendMail`), so a
 * mail outage never breaks the originating business operation.
 */
const deliver = (to: string, content: EmailContent): Promise<MailResult> =>
  sendMail({ to, subject: content.subject, text: content.text, html: content.html });

export const emailService = {
  /** Account email verification (sent on register + on resend). */
  sendEmailVerification(to: string, name: string, verifyLink: string): Promise<MailResult> {
    return deliver(to, verifyEmailTemplate(name, verifyLink));
  },

  /** Sent once an email address has been confirmed. */
  sendWelcome(to: string, name: string): Promise<MailResult> {
    return deliver(to, welcomeTemplate(name));
  },

  /** Password-reset link (forgot-password flow). */
  sendPasswordReset(to: string, name: string, resetLink: string): Promise<MailResult> {
    return deliver(to, passwordResetTemplate(name, resetLink));
  },

  /** Security confirmation after a password is changed/reset. */
  sendPasswordChanged(to: string, name: string): Promise<MailResult> {
    return deliver(to, passwordChangedTemplate(name));
  },

  /** Generic event notification (the email channel of the notifications module). */
  sendNotification(
    to: string,
    name: string,
    content: { title: string; body: string; actionUrl?: string }
  ): Promise<MailResult> {
    return deliver(to, notificationTemplate(name, content));
  },
};

export type EmailService = typeof emailService;
