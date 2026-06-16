import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env, isProduction } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Email transport (Nodemailer).
 *
 * Transport selection, decided once and cached:
 *   - SMTP_HOST set            → real SMTP (any provider: SES/SendGrid/Gmail…).
 *   - unset, development       → an auto-created Ethereal test inbox; every send
 *                                logs a preview URL so mail is viewable with zero
 *                                configuration.
 *   - unset, production        → a no-op JSON transport + an error log, so the
 *                                app never crashes but the misconfiguration is
 *                                loud and visible.
 */

// The concrete result type so `info.messageId` etc. are strongly typed.
type MailTransporter = Transporter<SMTPTransport.SentMessageInfo>;

let transporterPromise: Promise<MailTransporter> | null = null;

async function createTransport(): Promise<MailTransporter> {
  if (env.SMTP_HOST) {
    const options: SMTPTransport.Options = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
    };
    if (env.SMTP_USER && env.SMTP_PASS) {
      options.auth = { user: env.SMTP_USER, pass: env.SMTP_PASS };
    }
    logger.info('Email transport ready (SMTP)', { host: env.SMTP_HOST, port: env.SMTP_PORT });
    return nodemailer.createTransport(options);
  }

  if (isProduction) {
    logger.error('No SMTP configured in production — emails will be logged, not delivered');
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // Development convenience: a throwaway Ethereal inbox.
  const testAccount = await nodemailer.createTestAccount();
  logger.warn('No SMTP configured — using Ethereal test inbox (development only)', {
    user: testAccount.user,
  });
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

/** Lazily build (and cache) the transport so startup isn't blocked on email. */
export function getTransport(): Promise<MailTransporter> {
  transporterPromise ??= createTransport();
  return transporterPromise;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailResult {
  sent: boolean;
  messageId?: string;
  previewUrl?: string;
}

/**
 * Send an email. Deliberately never throws: a delivery failure is logged but
 * does not break the calling request (registration, password reset, …). Where
 * the email IS the deliverable, callers can inspect the returned `sent` flag.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  try {
    const transport = await getTransport();
    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });

    const preview = nodemailer.getTestMessageUrl(info);
    logger.info('Email sent', {
      to: message.to,
      subject: message.subject,
      messageId: info.messageId,
      ...(preview ? { previewUrl: preview } : {}),
    });

    return {
      sent: true,
      messageId: info.messageId,
      ...(preview ? { previewUrl: preview } : {}),
    };
  } catch (error) {
    logger.error('Failed to send email', {
      to: message.to,
      subject: message.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false };
  }
}
