import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import type { UserRole } from '@/types/roles';

/**
 * Role-Based Access Control.
 *
 * Returns a middleware that allows the request through only if the authenticated
 * user's role is in the allow-list. MUST run after `authenticate` (it relies on
 * `req.user`); if `req.user` is missing it fails closed with 401.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('ADMIN'), handler)
 *   router.post('/campaigns', authenticate, authorize('BRAND'), handler)
 *   router.get('/feed', authenticate, authorize('CREATOR', 'BRAND'), handler)
 *
 * Accepts either varargs or a single array, so both `authorize('ADMIN')` and
 * `authorize(['ADMIN'])` work.
 */
export function authorize(...roles: Array<UserRole | UserRole[]>): RequestHandler {
  const allowed = new Set<UserRole>(roles.flat());

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    if (!allowed.has(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
