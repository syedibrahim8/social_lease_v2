import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { submissionService } from '@/modules/submissions/submission.service';
import type {
  CreateSubmissionDto,
  ReviewSubmissionDto,
} from '@/modules/submissions/submission.validators';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.id;
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Submission id is required');
  }
  return id;
}

function requireContractId(req: Request): string {
  const { contractId } = req.params;
  if (!contractId) {
    throw ApiError.badRequest('Contract id is required');
  }
  return contractId;
}

export const submissionController = {
  create: asyncHandler(async (req, res) => {
    const dto = req.body as CreateSubmissionDto;
    const submission = await submissionService.create(requireUserId(req), dto);
    return ApiResponse.created(res, submission, 'Submission created');
  }),

  approve: asyncHandler(async (req, res) => {
    const result = await submissionService.approve(requireId(req), requireUserId(req));
    const message = result.released
      ? 'Submission approved; payout released to the creator'
      : 'Submission approved; payout will release once the creator completes payout onboarding';
    return ApiResponse.ok(res, result.submission, message);
  }),

  requestRevision: asyncHandler(async (req, res) => {
    const { reviewNote } = req.body as ReviewSubmissionDto;
    const submission = await submissionService.requestRevision(
      requireId(req),
      requireUserId(req),
      reviewNote
    );
    return ApiResponse.ok(res, submission, 'Revision requested');
  }),

  listMine: asyncHandler(async (req, res) => {
    const { items, meta } = await submissionService.listMine(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Submissions fetched', meta);
  }),

  listReceived: asyncHandler(async (req, res) => {
    const { items, meta } = await submissionService.listReceived(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Submissions fetched', meta);
  }),

  listForContract: asyncHandler(async (req, res) => {
    const { items, meta } = await submissionService.listForContract(
      requireContractId(req),
      requireUserId(req),
      req.query
    );
    return ApiResponse.ok(res, items, 'Submissions fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const submission = await submissionService.getById(requireId(req), requireUserId(req));
    return ApiResponse.ok(res, submission, 'Submission fetched');
  }),
};
