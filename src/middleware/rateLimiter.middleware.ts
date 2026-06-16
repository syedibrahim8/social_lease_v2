import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { HttpStatus } from '@/utils/httpStatus';
import type { ErrorBody } from '@/utils/ApiResponse';

/**
 * Global rate limiter.
 *
 * Window and max are env-driven. The handler returns our standard error
 * envelope so throttled responses look like every other error to clients.
 *
 * Note: the default in-memory store is per-process. Behind multiple instances
 * or a load balancer, swap in a shared store (e.g. Redis) so limits are global.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ErrorBody = {
      success: false,
      message: 'Too many requests, please try again later.',
      errors: [],
    };
    res.status(HttpStatus.TOO_MANY_REQUESTS).json(body);
  },
});
