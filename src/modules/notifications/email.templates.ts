import { env } from '@/config/env';

/**
 * Email content templates.
 *
 * Each template is a pure function returning `{ subject, text, html }`. Keeping
 * content separate from delivery (the email service) means templates can be unit
 * tested and restyled without touching transport logic. Both a plain-text and an
 * HTML part are always produced — text is the deliverability/accessibility
 * fallback for clients that don't render HTML.
 */

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

const BRAND = 'Creator Asset Marketplace';

/** Minimal, email-client-safe HTML shell with an optional call-to-action button. */
function layout(opts: {
  heading: string;
  body: string;
  cta?: { label: string; url: string };
}): string {
  const button = opts.cta
    ? `<p style="margin:28px 0;">
         <a href="${opts.cta.url}"
            style="background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;display:inline-block;font-weight:600;">
           ${opts.cta.label}
         </a>
       </p>
       <p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy this link:<br/>
         <a href="${opts.cta.url}" style="color:#4f46e5;">${opts.cta.url}</a>
       </p>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;padding:24px;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 8px;font-size:20px;">${BRAND}</h1>
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${opts.heading}</h2>
      <div style="font-size:15px;line-height:1.6;color:#374151;">${opts.body}</div>
      ${button}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />
      <p style="font-size:12px;color:#9ca3af;margin:0;">You're receiving this because an account on ${BRAND} used this email address.</p>
    </div>
  </body>
</html>`;
}

export function verifyEmailTemplate(name: string, link: string): EmailContent {
  return {
    subject: `Verify your email — ${BRAND}`,
    text: `Hi ${name},\n\nConfirm your email address to activate your account (link valid for 24 hours):\n${link}\n\nIf you didn't create an account, you can ignore this email.`,
    html: layout({
      heading: 'Confirm your email address',
      body: `<p>Hi ${name},</p><p>Confirm your email to activate your account. This link is valid for 24 hours.</p>`,
      cta: { label: 'Verify email', url: link },
    }),
  };
}

export function welcomeTemplate(name: string): EmailContent {
  const url = env.WEB_APP_URL;
  return {
    subject: `Welcome to ${BRAND}!`,
    text: `Hi ${name},\n\nYour email is verified and your account is active. Welcome aboard!\n\nGet started: ${url}`,
    html: layout({
      heading: 'Your account is ready 🎉',
      body: `<p>Hi ${name},</p><p>Your email is verified and your account is active. Welcome to ${BRAND}!</p>`,
      cta: { label: 'Go to dashboard', url },
    }),
  };
}

export function passwordResetTemplate(name: string, link: string): EmailContent {
  return {
    subject: `Reset your password — ${BRAND}`,
    text: `Hi ${name},\n\nWe received a request to reset your password (link valid for 1 hour):\n${link}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.`,
    html: layout({
      heading: 'Reset your password',
      body: `<p>Hi ${name},</p><p>We received a request to reset your password. This link is valid for 1 hour. If you didn't request it, you can ignore this email.</p>`,
      cta: { label: 'Reset password', url: link },
    }),
  };
}

export function passwordChangedTemplate(name: string): EmailContent {
  const url = `${env.WEB_APP_URL}/login`;
  return {
    subject: `Your password was changed — ${BRAND}`,
    text: `Hi ${name},\n\nThis is a confirmation that your password was just changed. If this wasn't you, reset your password immediately and contact support.\n\n${url}`,
    html: layout({
      heading: 'Your password was changed',
      body: `<p>Hi ${name},</p><p>This confirms your password was just changed. If this <strong>wasn't you</strong>, reset your password immediately and contact support.</p>`,
      cta: { label: 'Go to login', url },
    }),
  };
}
