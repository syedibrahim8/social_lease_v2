import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { env } from '@/config/env';
import { getRedis, isRedisConfigured } from '@/config/redis';
import { HttpStatus } from '@/utils/httpStatus';
import type { ErrorBody } from '@/utils/ApiResponse';

/**
 * A shared counter store when Redis is configured, so a limit holds across all
 * instances behind the load balancer; otherwise the default per-process store.
 */
export function rateLimitStore(prefix: string): Partial<Pick<Options, 'store'>> {
  if (!isRedisConfigured()) return {};
  const redis = getRedis();
  return {
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    }),
  };
}

/**
 * Global rate limiter.
 *
 * Window and max are env-driven. The handler returns our standard error
 * envelope so throttled responses look like every other error to clients.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  ...rateLimitStore('global'),
  handler: (_req, res) => {
    const body: ErrorBody = {
      success: false,
      message: 'Too many requests, please try again later.',
      errors: [],
    };
    res.status(HttpStatus.TOO_MANY_REQUESTS).json(body);
  },
});
