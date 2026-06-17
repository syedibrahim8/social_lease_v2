import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

/**
 * Environment configuration.
 *
 * This module is the single source of truth for runtime configuration. Every
 * other module reads config from the exported `env` object — never from
 * `process.env` directly. This gives us:
 *   - One validated, strongly-typed config object.
 *   - Fail-fast behaviour: a missing/invalid variable crashes the process at
 *     boot with a clear message, rather than causing subtle runtime failures.
 */

// Load variables from `.env` into process.env (no-op if the file is absent,
// e.g. in containers where env vars are injected by the orchestrator).
loadDotenv();

/** Comma-separated string -> trimmed, de-duplicated string array. */
const csvToArray = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),

  MONGODB_URI: z.string().url('MONGODB_URI must be a valid connection string'),

  CORS_ORIGINS: z.string().default('http://localhost:3000').transform(csvToArray),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters long'),

  // Public URL of the web frontend — used to build password-reset / verify links.
  WEB_APP_URL: z.string().url().default('http://localhost:3000'),

  // JWT — access and refresh tokens are signed with SEPARATE secrets so that a
  // leaked access secret cannot be used to mint refresh tokens, and vice versa.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  // Token lifetimes in milliseconds (also drive the refresh cookie maxAge).
  JWT_ACCESS_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  JWT_REFRESH_TTL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60 * 1000),

  // Google OAuth — optional. When unset, the Google sign-in endpoint is disabled.
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Email / SMTP — all optional. When SMTP_HOST is unset, development uses an
  // auto-created Ethereal test account (preview links are logged); production
  // logs an error instead of silently dropping mail.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Creator Asset Marketplace <no-reply@creatorassets.dev>'),

  // Stripe — optional. When unset, payment endpoints respond 501 (not configured).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Platform commission taken from each payout, as a percentage (0–100).
  PLATFORM_COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(10),
  // Default country for creators' Stripe Express connected accounts.
  STRIPE_CONNECT_COUNTRY: z.string().length(2).toUpperCase().default('US'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // We cannot use the Winston logger here: it depends on validated env, so we
  // fall back to console to report the fatal misconfiguration, then exit.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  // eslint-disable-next-line no-console
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = Object.freeze(parsed.data);

export type Env = typeof env;

/** Convenience flags, derived once. */
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
