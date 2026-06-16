import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { brandService } from '@/modules/brands/brand.service';
import type { CreateBrandDto, UpdateBrandDto } from '@/modules/brands/brand.validators';

/** Read the authenticated user id; routes guarantee it via `authenticate`. */
function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

export const brandController = {
  create: asyncHandler(async (req, res) => {
    const profile = await brandService.createProfile(
      requireUserId(req),
      req.body as CreateBrandDto
    );
    return ApiResponse.created(res, profile, 'Company profile created');
  }),

  getMine: asyncHandler(async (req, res) => {
    const profile = await brandService.getMyProfile(requireUserId(req));
    return ApiResponse.ok(res, profile, 'Company profile fetched');
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest('Profile id is required');
    }
    const profile = await brandService.getProfileById(id);
    return ApiResponse.ok(res, profile, 'Company profile fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const profile = await brandService.updateMyProfile(
      requireUserId(req),
      req.body as UpdateBrandDto
    );
    return ApiResponse.ok(res, profile, 'Company profile updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await brandService.deleteMyProfile(requireUserId(req));
    return ApiResponse.ok(res, null, 'Company profile deleted');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, meta } = await brandService.listProfiles(req.query);
    return ApiResponse.ok(res, items, 'Companies fetched', meta);
  }),
};
