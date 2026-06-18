import type { Response } from 'express';
import { logger } from '@/config/logger';

/**
 * In-process Server-Sent-Events hub for real-time notifications.
 *
 * Each authenticated client holding `GET /notifications/stream` is registered
 * here; `publishToUser` pushes a JSON event down every open connection for that
 * user. In-memory + per-process — swap for Redis pub-sub (fan-out across
 * instances) before scaling out, same caveat as the rate limiter + event bus.
 */
interface StreamClient {
  userId: string;
  res: Response;
}

const clients = new Set<StreamClient>();

export const notificationStream = {
  /** Register an SSE connection and tear it down when the client disconnects. */
  addClient(userId: string, res: Response): void {
    const client: StreamClient = { userId, res };
    clients.add(client);
    res.on('close', () => {
      clients.delete(client);
    });
  },

  /** Push a payload to every open connection belonging to `userId`. */
  publishToUser(userId: string, payload: unknown): void {
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
  },

  /** Open connections count (diagnostics/tests). */
  clientCount(): number {
    return clients.size;
  },
};
