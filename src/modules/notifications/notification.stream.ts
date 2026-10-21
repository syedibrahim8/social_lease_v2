import type { Response } from 'express';
import { logger } from '@/config/logger';
import { getRedis, getRedisSubscriber, isRedisConfigured } from '@/config/redis';

/**
 * Server-Sent-Events hub for real-time notifications.
 *
 * Each authenticated client holding `GET /notifications/stream` is registered
 * with the instance it connected to. `publishToUser` delivers to that user's
 * open connections:
 *   - single instance (no Redis): written straight to the local connections;
 *   - several instances (REDIS_URL): published on one Redis channel, and every
 *     instance — including this one — writes it to ITS local connections. So a
 *     notification created on instance A reaches a browser connected to B.
 */
interface StreamClient {
  userId: string;
  res: Response;
}

const CHANNEL = 'notifications:sse';
const clients = new Set<StreamClient>();
let subscribed = false;

function deliverLocally(userId: string, payload: unknown): void {
  const frame = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    if (client.userId !== userId) continue;
    try {
      client.res.write(frame);
    } catch (error) {
      logger.warn('SSE write failed; dropping client', {
        error: error instanceof Error ? error.message : String(error),
      });
      clients.delete(client);
    }
  }
}

/** Subscribe this instance to the shared channel (once, and only with Redis). */
function ensureSubscribed(): void {
  if (subscribed || !isRedisConfigured()) return;
  subscribed = true;
  const subscriber = getRedisSubscriber();
  subscriber.on('message', (channel: string, message: string) => {
    if (channel !== CHANNEL) return;
    try {
      const { userId, payload } = JSON.parse(message) as { userId: string; payload: unknown };
      deliverLocally(userId, payload);
    } catch (error) {
      logger.warn('Malformed SSE fan-out message', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
  subscriber.subscribe(CHANNEL).catch((error: unknown) => {
    subscribed = false;
    logger.error('SSE fan-out subscribe failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

export const notificationStream = {
  /** Start receiving fan-out from other instances (no-op without Redis). */
  init(): void {
    ensureSubscribed();
  },

  /** Register an SSE connection and tear it down when the client disconnects. */
  addClient(userId: string, res: Response): void {
    ensureSubscribed();
    const client: StreamClient = { userId, res };
    clients.add(client);
    res.on('close', () => {
      clients.delete(client);
    });
  },

  /** Push a payload to every open connection belonging to `userId`, anywhere. */
  publishToUser(userId: string, payload: unknown): void {
    if (!isRedisConfigured()) {
      deliverLocally(userId, payload);
      return;
    }
    getRedis()
      .publish(CHANNEL, JSON.stringify({ userId, payload }))
      .catch((error: unknown) => {
        // Redis down: still reach the clients on this instance.
        logger.warn('SSE fan-out publish failed; delivering locally', {
          error: error instanceof Error ? error.message : String(error),
        });
        deliverLocally(userId, payload);
      });
  },

  /** Open connections count on this instance (diagnostics/tests). */
  clientCount(): number {
    return clients.size;
  },
};
