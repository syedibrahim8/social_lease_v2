import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { analyticsService } from '@/modules/analytics/analytics.service';
import type { UserRole } from '@/types/roles';

/**
 * Resolve which user's dashboard to return: the caller's own (for the matching
 * role), or — when the caller is an ADMIN — the `?userId` they specified.
 */
function resolveTargetUser(req: Request, ownerRole: UserRole): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  if (req.user.role === ownerRole) {
    return req.user.id;
  }
  // Only an ADMIN reaches here (route RBAC allows ownerRole + ADMIN).
  const { userId } = req.query;
  if (typeof userId !== 'string' || userId.length === 0) {
    throw ApiError.badRequest('Admins must pass ?userId to view a specific dashboard');
  }
  return userId;
}

export const analyticsController = {
  platform: asyncHandler(async (_req, res) => {
    const data = await analyticsService.platform();
    return ApiResponse.ok(res, data, 'Platform analytics');
  }),

  creator: asyncHandler(async (req, res) => {
    const data = await analyticsService.creator(resolveTargetUser(req, 'CREATOR'));
    return ApiResponse.ok(res, data, 'Creator analytics');
  }),

  brand: asyncHandler(async (req, res) => {
    const data = await analyticsService.brand(resolveTargetUser(req, 'BRAND'));
    return ApiResponse.ok(res, data, 'Brand analytics');
  }),
};
