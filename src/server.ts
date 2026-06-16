import type { Server } from 'node:http';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';

/**
 * Process entry point.
 *
 * Boot sequence:
 *   1. Connect to MongoDB (fail fast if unreachable).
 *   2. Build the Express app and bind the HTTP port.
 *   3. Register graceful-shutdown and last-resort crash handlers.
 *
 * Graceful shutdown stops accepting new connections, drains in-flight requests,
 * closes the DB connection, then exits — so deploys/restarts don't drop traffic.
 */
async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      apiPrefix: env.API_PREFIX,
    });
  });

  registerShutdownHandlers(server);
}

function registerShutdownHandlers(server: Server): void {
  let shuttingDown = false;

  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal}, shutting down gracefully...`);

    // Force-exit if draining takes too long.
    const forceTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10_000);
    forceTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      await disconnectDatabase();
      clearTimeout(forceTimer);
      logger.info('Shutdown complete');
      process.exit(exitCode);
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  // Termination signals (Ctrl-C, container stop).
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  // Last-resort safety nets: log, then shut down. A process in an unknown state
  // after these should be replaced, not kept alive.
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    void shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
    void shutdown('unhandledRejection', 1);
  });
}

void bootstrap().catch((error: unknown) => {
  logger.error('Fatal error during startup', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
