import type { Response } from 'express';
import { HttpStatus } from '@/utils/httpStatus';
import type { ApiErrorDetail } from '@/utils/ApiError';

/**
 * Standardised API response envelopes.
 *
 * Every endpoint returns one of these two shapes, so clients can rely on a
 * single contract:
 *
 *   Success: { success: true,  message, data, meta? }
 *   Error:   { success: false, message, errors }
 *
 * Controllers use the static helpers (`ApiResponse.ok`, `ApiResponse.created`,
 * ...). The error envelope is normally produced by the global error handler,
 * but the type is exported here so the contract lives in one place.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorBody {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
}

export const ApiResponse = {
  /** Send a success envelope with an explicit status code. */
  send<T>(
    res: Response,
    statusCode: HttpStatus,
    message: string,
    data: T,
    meta?: PaginationMeta
  ): Response {
    const body: SuccessBody<T> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  },

  ok<T>(res: Response, data: T, message = 'Success', meta?: PaginationMeta): Response {
    return ApiResponse.send(res, HttpStatus.OK, message, data, meta);
  },

  created<T>(res: Response, data: T, message = 'Created'): Response {
    return ApiResponse.send(res, HttpStatus.CREATED, message, data);
  },

  /** 204 — no envelope body by convention. */
  noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  },
};
