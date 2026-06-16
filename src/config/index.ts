/**
 * Config barrel — single import surface for the configuration layer.
 * Usage: `import { env, logger } from '@/config';`
 */
export { env, isProduction, isDevelopment, isTest } from '@/config/env';
export type { Env } from '@/config/env';
export { logger, httpLogStream } from '@/config/logger';
export { connectDatabase, disconnectDatabase } from '@/config/database';
export { getTransport, sendMail } from '@/config/mailer';
export type { MailMessage, MailResult } from '@/config/mailer';
