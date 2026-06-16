import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { UserRole } from '@/types/roles';

/**
 * JWT signing & verification.
 *
 * Two independently-secured token types:
 *   - Access token  — short-lived, sent to clients as a Bearer token. Carries
 *                     the minimal claims needed for authorization (sub + role).
 *   - Refresh token — long-lived, stored in an httpOnly cookie, used only to
 *                     mint new access tokens. Signed with a DIFFERENT secret.
 *
 * Both are stamped with an issuer + audience and verified against them, so a
 * token minted by another service (or for another audience) is rejected.
 */

const ISSUER = 'creator-asset-marketplace';
const AUDIENCE = 'cam-api';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  /** Token id — lets us reason about a specific refresh token if needed. */
  jti: string;
}

const signOptions: SignOptions = { issuer: ISSUER, audience: AUDIENCE };
const verifyOptions: VerifyOptions = { issuer: ISSUER, audience: AUDIENCE };

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    ...signOptions,
    expiresIn: Math.floor(env.JWT_ACCESS_TTL_MS / 1000),
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    ...signOptions,
    expiresIn: Math.floor(env.JWT_REFRESH_TTL_MS / 1000),
  });
}

/** Verify an access token. Throws on invalid/expired token. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, verifyOptions);
  if (typeof decoded === 'string') {
    throw new Error('Unexpected token format');
  }
  return decoded as AccessTokenPayload;
}

/** Verify a refresh token. Throws on invalid/expired token. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, verifyOptions);
  if (typeof decoded === 'string') {
    throw new Error('Unexpected token format');
  }
  return decoded as RefreshTokenPayload;
}
