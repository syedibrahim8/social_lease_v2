import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { creatorService } from '@/modules/creators/creator.service';
import type { CreateCreatorDto, UpdateCreatorDto } from '@/modules/creators/creator.validators';

/** Read the authenticated user id; routes guarantee it via `authenticate`. */
function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

export const creatorController = {
  create: asyncHandler(async (req, res) => {
    const profile = await creatorService.createProfile(
      requireUserId(req),
      req.body as CreateCreatorDto
    );
    return ApiResponse.created(res, profile, 'Creator profile created');
  }),

  getMine: asyncHandler(async (req, res) => {
    const profile = await creatorService.getMyProfile(requireUserId(req));
    return ApiResponse.ok(res, profile, 'Creator profile fetched');
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest('Profile id is required');
    }
    const profile = await creatorService.getProfileById(id);
    return ApiResponse.ok(res, profile, 'Creator profile fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const profile = await creatorService.updateMyProfile(
      requireUserId(req),
      req.body as UpdateCreatorDto
    );
    return ApiResponse.ok(res, profile, 'Creator profile updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await creatorService.deleteMyProfile(requireUserId(req));
    return ApiResponse.ok(res, null, 'Creator profile deleted');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, meta } = await creatorService.listProfiles(req.query);
    return ApiResponse.ok(res, items, 'Creators fetched', meta);
  }),
};
