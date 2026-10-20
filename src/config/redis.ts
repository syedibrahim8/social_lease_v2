import { Redis } from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

/**
 * Optional Redis, for running more than one API instance.
 *
 * With `REDIS_URL` unset nothing here connects and every caller falls back to
 * its in-process behaviour, so a single instance needs no Redis at all. With it
 * set: the rate limiters share counters, live notifications fan out to SSE
 * clients connected to any instance, and the payment reconciler takes a lock.
 *
 * Two connections: a subscribed connection can't issue normal commands.
 */
let client: Redis | null = null;
let subscriber: Redis | null = null;

export function isRedisConfigured(): boolean {
  return Boolean(env.REDIS_URL);
}

function connect(role: string): Redis {
  if (!env.REDIS_URL) throw new Error('REDIS_URL is not configured');
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
  redis.on('error', (error: Error) => {
    logger.error(`Redis ${role} error`, { error: error.message });
  });
  redis.on('ready', () => logger.info(`Redis ${role} connected`));
  return redis;
}

export function getRedis(): Redis {
  client ??= connect('client');
  return client;
}

export function getRedisSubscriber(): Redis {
  subscriber ??= connect('subscriber');
  return subscriber;
}

export async function closeRedis(): Promise<void> {
  await Promise.all([client?.quit(), subscriber?.quit()]);
  client = null;
  subscriber = null;
}
