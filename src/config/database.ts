import mongoose, { type ClientSession } from 'mongoose';
import { env, isProduction } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * MongoDB connection lifecycle (Mongoose).
 *
 * Responsibilities:
 *   - Establish the connection with sensible pool/timeout settings.
 *   - Wire connection event listeners for observability.
 *   - Provide a clean disconnect for graceful shutdown.
 *
 * The server bootstrap awaits `connectDatabase()` before binding the HTTP port,
 * so we never accept traffic without a healthy data layer.
 */

// Fail fast on queries against undeclared fields, and surface bad queries in
// non-production so they are caught during development rather than in prod.
mongoose.set('strictQuery', true);
if (!isProduction) {
  mongoose.set('debug', env.LOG_LEVEL === 'debug');
}

const connection = mongoose.connection;

connection.on('connected', () => {
  logger.info('MongoDB connected', { host: connection.host, name: connection.name });
});
connection.on('error', (error: Error) => {
  logger.error('MongoDB connection error', { error: error.message });
});
connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    // Auto-build declared indexes in non-production; in production this should
    // be handled by a migration step to avoid blocking startup on large data.
    autoIndex: !isProduction,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}

/**
 * Run `fn` inside a MongoDB transaction. Every write that moves money (payment
 * status, wallet balances, ledger rows, contract/campaign status) goes through
 * here so a crash part-way leaves nothing half-applied.
 *
 * The driver retries `fn` on transient transaction errors, so `fn` must only
 * touch the database through `session` and have no other side effects (no
 * Stripe calls, no event emits) — do those before or after.
 */
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
