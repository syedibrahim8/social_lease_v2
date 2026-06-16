import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';

/**
 * Catch-all for unmatched routes. Placed after all route registrations and
 * before the error handler, it converts an unknown path into a standard 404
 * `ApiError` so it flows through the same error pipeline as everything else.
 */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
