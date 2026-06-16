/**
 * Express type augmentation.
 *
 * Adds properties that our middleware attaches to the request object so they
 * are strongly typed everywhere downstream. The `auth` slice will later extend
 * this with `req.user`.
 */
import 'express';
import type { UserRole } from '@/types/roles';

/** The authenticated principal attached by the `authenticate` middleware. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      /** Correlation id assigned per request for tracing across logs. */
      id: string;
      /** Present only after `authenticate` has run successfully. */
      user?: AuthenticatedUser;
    }
  }
}

export {};
