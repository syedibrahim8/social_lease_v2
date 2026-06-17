import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { contractService } from '@/modules/contracts/contract.service';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Contract id is required');
  }
  return id;
}

export const contractController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await contractService.list(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Contracts fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const contract = await contractService.getById(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, contract, 'Contract fetched');
  }),

  cancel: asyncHandler(async (req, res) => {
    const contract = await contractService.cancel(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, contract, 'Contract cancelled');
  }),
};
