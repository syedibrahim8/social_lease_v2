import type { Request } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { paymentService } from '@/modules/payments/payment.service';

function requireUserId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

function requireParam(req: Request, key: 'id' | 'contractId'): string {
  const value = req.params[key];
  if (!value) throw ApiError.badRequest(`${key} is required`);
  return value;
}

export const paymentController = {
  // Creator Connect onboarding.
  onboard: asyncHandler(async (req, res) => {
    const result = await paymentService.onboardCreator(requireUserId(req));
    return ApiResponse.ok(res, result, 'Onboarding link created');
  }),

  connectStatus: asyncHandler(async (req, res) => {
    const status = await paymentService.getConnectStatus(requireUserId(req));
    return ApiResponse.ok(res, status, 'Connect status');
  }),

  // Brand funds a contract.
  checkout: asyncHandler(async (req, res) => {
    const result = await paymentService.createCheckout(
      requireParam(req, 'contractId'),
      requireUserId(req)
    );
    return ApiResponse.created(res, result, 'Checkout session created');
  }),

  release: asyncHandler(async (req, res) => {
    const payment = await paymentService.releasePayment(
      requireParam(req, 'contractId'),
      requireUserId(req)
    );
    return ApiResponse.ok(res, payment, 'Payment released to creator');
  }),

  refund: asyncHandler(async (req, res) => {
    const payment = await paymentService.refundPayment(
      requireParam(req, 'contractId'),
      requireUserId(req)
    );
    return ApiResponse.ok(res, payment, 'Payment refunded');
  }),

  // Records / wallet / ledger.
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await paymentService.listMyPayments(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Payments fetched', meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const payment = await paymentService.getPayment(requireParam(req, 'id'), requireUserId(req));
    return ApiResponse.ok(res, payment, 'Payment fetched');
  }),

  wallet: asyncHandler(async (req, res) => {
    const wallet = await paymentService.getWallet(requireUserId(req));
    return ApiResponse.ok(res, wallet, 'Wallet fetched');
  }),

  transactions: asyncHandler(async (req, res) => {
    const { items, meta } = await paymentService.listMyTransactions(requireUserId(req), req.query);
    return ApiResponse.ok(res, items, 'Transactions fetched', meta);
  }),
};
