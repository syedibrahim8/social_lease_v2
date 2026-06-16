import mongoose from 'mongoose';
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
