import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { campaignService } from '@/modules/campaigns/campaign.service';
import type { CreateCampaignDto, UpdateCampaignDto } from '@/modules/campaigns/campaign.validators';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Campaign id is required');
  }
  return id;
}

export const campaignController = {
  create: asyncHandler(async (req, res) => {
    const campaign = await campaignService.createCampaign(
      requireUserId(req),
      req.body as CreateCampaignDto
    );
    return ApiResponse.created(res, campaign, 'Campaign created');
  }),

  // Public marketplace browse (PUBLISHED only).
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await campaignService.listPublished(req.query);
    return ApiResponse.ok(res, items, 'Campaigns fetched', meta);
  }),

  // The authenticated brand's own campaigns (all statuses).
  listMine: asyncHandler(async (req, res) => {
    const { items, meta } = await campaignService.listMine(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Your campaigns fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const campaign = await campaignService.getCampaign(requireId(req), req.user?.id);
    return ApiResponse.ok(res, campaign, 'Campaign fetched');
  }),

  update: asyncHandler(async (req, res) => {
    const campaign = await campaignService.updateCampaign(
      requireId(req),
      requireUserId(req),
      req.body as UpdateCampaignDto
    );
    return ApiResponse.ok(res, campaign, 'Campaign updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await campaignService.deleteCampaign(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, null, 'Campaign deleted');
  }),

  publish: asyncHandler(async (req, res) => {
    const campaign = await campaignService.publishCampaign(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, campaign, 'Campaign published');
  }),
};
