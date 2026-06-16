import type { CookieOptions, Request, Response } from 'express';
import { env, isProduction } from '@/config/env';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/utils/httpStatus';
import { authService } from '@/modules/auth/auth.service';
import type { AuthResult } from '@/modules/auth/auth.types';
import type {
  ForgotPasswordDto,
  GoogleDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '@/modules/auth/auth.validators';

const REFRESH_COOKIE = 'refreshToken';
// Scope the cookie to the auth routes so it is only ever sent where it's needed.
const REFRESH_COOKIE_PATH = `${env.API_PREFIX}/auth`;

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    // Cross-site (SPA on another origin) needs SameSite=None+Secure in prod;
    // 'lax' is fine for local same-site development.
    sameSite: isProduction ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: env.JWT_REFRESH_TTL_MS,
  };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
}

/** Set the refresh cookie and shape the JSON body (refresh token stays out of it). */
function sendAuth(
  res: Response,
  status: HttpStatus,
  result: AuthResult,
  message: string
): Response {
  setRefreshCookie(res, result.refreshToken);
  return ApiResponse.send(res, status, message, {
    user: result.user,
    accessToken: result.accessToken,
  });
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  return cookies?.[REFRESH_COOKIE];
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body as RegisterDto);
    return sendAuth(res, HttpStatus.CREATED, result, 'Registration successful');
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body as LoginDto);
    return sendAuth(res, HttpStatus.OK, result, 'Login successful');
  }),

  google: asyncHandler(async (req, res) => {
    const result = await authService.loginWithGoogle(req.body as GoogleDto);
    return sendAuth(res, HttpStatus.OK, result, 'Login successful');
  }),

  refresh: asyncHandler(async (req, res) => {
    const token = readRefreshCookie(req);
    if (!token) {
      throw ApiError.unauthorized('No refresh token provided');
    }
    const result = await authService.refresh(token);
    return sendAuth(res, HttpStatus.OK, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req, res) => {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    clearRefreshCookie(res);
    return ApiResponse.ok(res, null, 'Logged out');
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body as ForgotPasswordDto);
    // Always the same response — no account enumeration.
    return ApiResponse.ok(res, null, 'If an account exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body as ResetPasswordDto);
    return ApiResponse.ok(res, null, 'Password has been reset, please log in');
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body as VerifyEmailDto);
    return ApiResponse.ok(res, null, 'Email verified');
  }),

  resendVerification: asyncHandler(async (req, res) => {
    // `req.user` is guaranteed by the `authenticate` middleware on this route.
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    await authService.resendVerification(req.user.id);
    return ApiResponse.ok(res, null, 'Verification email sent');
  }),

  me: asyncHandler((req, res) => {
    return ApiResponse.ok(res, { user: req.user }, 'Current user');
  }),
};
