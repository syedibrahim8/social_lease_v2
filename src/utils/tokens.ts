import { createHash, randomBytes } from 'node:crypto';

/**
 * Opaque-token helpers for password-reset and email-verification flows, and for
 * persisting refresh tokens.
 *
 * Pattern: generate a high-entropy random token, send the RAW value to the user
 * (email link / cookie), but persist only its SHA-256 hash. If the database
 * leaks, the stored hashes cannot be used to impersonate anyone. SHA-256 (not
 * bcrypt) is correct here because these tokens are already high-entropy random
 * — there is nothing to brute-force, so the slow KDF bcrypt provides is wasted.
 */

/** Generate a URL-safe random token (default 32 bytes → 64 hex chars). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Deterministically hash a token for storage / comparison. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** A raw token paired with its hash and an expiry timestamp. */
export interface IssuedToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export function issueToken(ttlMs: number, bytes = 32): IssuedToken {
  const raw = generateToken(bytes);
  return {
    raw,
    hash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  };
}
