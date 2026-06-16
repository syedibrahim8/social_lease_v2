import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { ApiError, type ApiErrorDetail } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/httpStatus';
import type { ErrorBody } from '@/utils/ApiResponse';
import { logger } from '@/config/logger';
import { isProduction } from '@/config/env';

/** MongoDB duplicate-key errors carry code 11000 and a `keyValue` map. */
interface MongoDuplicateKeyError extends Error {
  code: number;
  keyValue?: Record<string, unknown>;
}

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

/**
 * Translate any thrown value into a normalised `ApiError`. Keeping this mapping
 * in one place means controllers and services can throw the most natural error
 * (a Zod parse error, a Mongoose validation error, a plain `ApiError`) and the
 * client always receives a consistent shape.
 */
function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  // Zod — request/body validation failures.
  if (error instanceof ZodError) {
    const details: ApiErrorDetail[] = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return ApiError.unprocessable('Validation failed', details);
  }

  // Mongoose schema validation.
  if (error instanceof MongooseError.ValidationError) {
    const details: ApiErrorDetail[] = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.unprocessable('Validation failed', details);
  }

  // Mongoose invalid ObjectId / cast failures.
  if (error instanceof MongooseError.CastError) {
    return ApiError.badRequest(`Invalid value for field '${error.path}'`);
  }

  // Duplicate unique key.
  if (isMongoDuplicateKeyError(error)) {
    const fields = error.keyValue ? Object.keys(error.keyValue) : [];
    const details: ApiErrorDetail[] = fields.map((field) => ({
      field,
      message: `'${String(error.keyValue?.[field])}' already exists`,
    }));
    return ApiError.conflict('Duplicate field value', details);
  }

  // Anything else is an unexpected, non-operational error.
  const message = error instanceof Error ? error.message : 'Internal server error';
  const internal = ApiError.internal(message);
  if (error instanceof Error && error.stack) internal.stack = error.stack;
  return internal;
}

/**
 * Global error-handling middleware. Must be registered LAST and must keep the
 * 4-argument signature so Express recognises it as an error handler.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const apiError = normalizeError(err);

  // Log: 5xx (and non-operational) at error level with stack; 4xx at warn.
  const logMeta = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode: apiError.statusCode,
  };
  if (apiError.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR || !apiError.isOperational) {
    logger.error(apiError.message, { ...logMeta, stack: apiError.stack });
  } else {
    logger.warn(apiError.message, logMeta);
  }

  // For unexpected 5xx errors in production, do not leak internal detail.
  const clientMessage =
    apiError.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR && isProduction
      ? 'Internal server error'
      : apiError.message;

  const body: ErrorBody = {
    success: false,
    message: clientMessage,
    errors: apiError.errors,
  };

  res.status(apiError.statusCode).json(body);
}
