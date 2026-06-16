import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's error pipeline via `next(err)`.
 *
 * Without this, a thrown error inside an `async` handler becomes an unhandled
 * rejection and the request hangs. With it, controllers can simply `throw`
 * (e.g. `throw ApiError.notFound()`) and trust the global error handler to
 * format the response.
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
