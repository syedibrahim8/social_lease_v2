import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '@/config/logger';

/**
 * Assigns a correlation id to every request and logs a single structured line
 * when the response finishes (method, path, status, duration). Honours an
 * inbound `X-Request-Id` header so ids can be propagated from an upstream proxy
 * or gateway, and echoes it back on the response for client-side correlation.
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  req.id = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.http('request.completed', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
}
