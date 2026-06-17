import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { assetService } from '@/modules/assets/asset.service';
import type {
  AvailabilityBlockDto,
  CreateAssetDto,
  UpdateAssetDto,
} from '@/modules/assets/asset.validators';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Asset id is required');
  }
  return id;
}

function requireBlockId(req: Request): string {
  const { blockId } = req.params;
  if (!blockId) {
    throw ApiError.badRequest('Block id is required');
  }
  return blockId;
}

export const assetController = {
  create: asyncHandler(async (req, res) => {
    const asset = await assetService.create(requireUserId(req), req.body as CreateAssetDto);
    return ApiResponse.created(res, asset, 'Asset created');
  }),

  browse: asyncHandler(async (req, res) => {
    const { items, meta } = await assetService.browse(req.query);
    return ApiResponse.ok(res, items, 'Assets fetched', meta);
  }),

  listMine: asyncHandler(async (req, res) => {
    const { items, meta } = await assetService.listMine(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Assets fetched', meta);
  }),

  analytics: asyncHandler(async (req, res) => {
    const data = await assetService.analytics(requireUserId(req));
    return ApiResponse.ok(res, data, 'Asset analytics');
  }),

  getById: asyncHandler(async (req, res) => {
    const asset = await assetService.getById(requireId(req));
    return ApiResponse.ok(res, asset, 'Asset fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const asset = await assetService.update(
      requireId(req),
      requireUserId(req),
      req.body as UpdateAssetDto
    );
    return ApiResponse.ok(res, asset, 'Asset updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await assetService.remove(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, null, 'Asset deleted');
  }),

  getAvailability: asyncHandler(async (req, res) => {
    const availability = await assetService.getAvailability(requireId(req));
    return ApiResponse.ok(res, availability, 'Availability fetched');
  }),

  addBlock: asyncHandler(async (req, res) => {
    const asset = await assetService.addBlock(
      requireId(req),
      requireUserId(req),
      req.body as AvailabilityBlockDto
    );
    return ApiResponse.created(res, asset, 'Calendar block added');
  }),

  removeBlock: asyncHandler(async (req, res) => {
    const asset = await assetService.removeBlock(
      requireId(req),
      requireUserId(req),
      requireBlockId(req)
    );
    return ApiResponse.ok(res, asset, 'Calendar block removed');
  }),
};
