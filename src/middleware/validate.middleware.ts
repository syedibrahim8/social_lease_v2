import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Request validation middleware.
 *
 * Validates any of `body`, `params`, `query` against the supplied Zod schemas.
 * On success the PARSED (coerced, defaulted, stripped) values replace the raw
 * input, so handlers receive clean, typed data. On failure the ZodError is
 * forwarded to the global error handler, which renders the standard 422
 * envelope with per-field details.
 */
export interface RequestSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Zod's `parse` is typed `any`; route results through `unknown` so we never
      // assign an `any` onto the typed request properties.
      if (schemas.body) {
        const parsed: unknown = schemas.body.parse(req.body);
        req.body = parsed;
      }
      if (schemas.params) {
        const parsed: unknown = schemas.params.parse(req.params);
        req.params = parsed as typeof req.params;
      }
      if (schemas.query) {
        // req.query has only a getter on some Express versions — mutate in place.
        const parsed: unknown = schemas.query.parse(req.query);
        Object.assign(req.query, parsed);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
