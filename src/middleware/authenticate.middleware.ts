import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { ApiError } from '@/utils/ApiError';
import { asyncHandler } from '@/utils/asyncHandler';
import { userRepository } from '@/modules/users/user.repository';

/**
 * Authentication middleware.
 *
 * Extracts the Bearer access token, verifies its signature/expiry, then loads
 * the user from the database. We re-load (rather than trusting the token's
 * claims alone) so that a freshly deleted user or a just-changed role takes
 * effect immediately, at the cost of one indexed lookup per request.
 *
 * On success it attaches `req.user`; on any failure it raises 401.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let userId: string;
    try {
      userId = verifyAccessToken(token).sub;
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };
    next();
  }
);
