import { HttpStatus } from '@/utils/httpStatus';

/** Shape of a single field-level error detail returned to clients. */
export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/**
 * Operational error — an error we expect and handle deliberately (validation
 * failure, not found, unauthorized, etc.), as opposed to a programmer bug.
 *
 * The global error handler distinguishes `ApiError` (isOperational = true) from
 * unexpected exceptions: operational errors are returned to the client as-is,
 * while unexpected ones are logged with full detail and reported generically to
 * avoid leaking internals.
 *
 * Static factories cover the common cases so call sites stay terse and
 * consistent: `throw ApiError.notFound('Campaign not found')`.
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly errors: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: HttpStatus,
    message: string,
    errors: ApiErrorDetail[] = [],
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(HttpStatus.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message = 'Resource conflict', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(HttpStatus.CONFLICT, message, errors);
  }

  static unprocessable(message = 'Validation failed', errors: ApiErrorDetail[] = []): ApiError {
    return new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, message, errors);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(HttpStatus.TOO_MANY_REQUESTS, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    // Internal errors are non-operational: they indicate a bug or outage.
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message, [], false);
  }
}
