import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { verificationService } from '@/modules/verifications/verification.service';
import type {
  ApproveVerificationDto,
  RejectVerificationDto,
  SubmitVerificationDto,
} from '@/modules/verifications/verification.validators';
import type { UserRole } from '@/types/roles';

function requireUser(req: Request): { id: string; role: UserRole } {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return { id: req.user.id, role: req.user.role };
}

function requireId(req: Request): string {
  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('Verification id is required');
  }
  return id;
}

export const verificationController = {
  submit: asyncHandler(async (req, res) => {
    const request = await verificationService.submit(
      requireUser(req),
      req.body as SubmitVerificationDto
    );
    return ApiResponse.created(res, request, 'Verification request submitted');
  }),

  listMine: asyncHandler(async (req, res) => {
    const { id } = requireUser(req);
    const { items, meta } = await verificationService.listMine(id, req.query);
    return ApiResponse.ok(res, items, 'Verification requests fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const request = await verificationService.getById(requireId(req), requireUser(req));
    return ApiResponse.ok(res, request, 'Verification request fetched');
  }),

  // --- admin ---
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await verificationService.adminList(req.query);
    return ApiResponse.ok(res, items, 'Verification requests fetched', meta);
  }),

  approve: asyncHandler(async (req, res) => {
    const { reviewNote } = req.body as ApproveVerificationDto;
    const request = await verificationService.approve(
      requireId(req),
      requireUser(req).id,
      reviewNote
    );
    return ApiResponse.ok(res, request, 'Verification request approved');
  }),

  reject: asyncHandler(async (req, res) => {
    const { reviewNote } = req.body as RejectVerificationDto;
    const request = await verificationService.reject(
      requireId(req),
      requireUser(req).id,
      reviewNote
    );
    return ApiResponse.ok(res, request, 'Verification request rejected');
  }),

  audit: asyncHandler(async (req, res) => {
    const logs = await verificationService.listAudit(requireId(req));
    return ApiResponse.ok(res, logs, 'Audit log fetched');
  }),
};
