import bcrypt from 'bcryptjs';

/**
 * Password hashing helpers (bcrypt).
 *
 * Cost factor 12 is a sensible 2020s default: strong enough to make brute-force
 * expensive, fast enough to not become a login-latency or DoS vector. bcrypt
 * embeds the salt + cost in the hash string, so no separate salt storage.
 */
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
