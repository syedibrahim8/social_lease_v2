import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { applicationService } from '@/modules/applications/application.service';
import type { ApplyDto, CounterOfferDto } from '@/modules/applications/application.validators';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Application id is required');
  }
  return id;
}

export const applicationController = {
  apply: asyncHandler(async (req, res) => {
    const application = await applicationService.apply(requireUserId(req), req.body as ApplyDto);
    return ApiResponse.created(res, application, 'Application submitted');
  }),

  listMine: asyncHandler(async (req, res) => {
    const { items, meta } = await applicationService.listMine(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Your applications fetched', meta);
  }),

  listReceived: asyncHandler(async (req, res) => {
    const { items, meta } = await applicationService.listReceived(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Received applications fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const application = await applicationService.getById(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, application, 'Application fetched');
  }),

  counter: asyncHandler(async (req, res) => {
    const application = await applicationService.counterOffer(
      requireId(req),
      requireUserId(req),
      req.body as CounterOfferDto
    );
    return ApiResponse.ok(res, application, 'Counter offer sent');
  }),

  accept: asyncHandler(async (req, res) => {
    const application = await applicationService.acceptOffer(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, application, 'Offer accepted');
  }),

  reject: asyncHandler(async (req, res) => {
    const application = await applicationService.rejectOffer(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, application, 'Application rejected');
  }),

  withdraw: asyncHandler(async (req, res) => {
    const application = await applicationService.withdraw(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, application, 'Application withdrawn');
  }),
};
