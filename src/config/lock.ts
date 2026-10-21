import { getRedis, isRedisConfigured } from '@/config/redis';

/**
 * Best-effort mutual exclusion across API instances.
 *
 * Without Redis there is one instance by definition (the in-memory rate limiter
 * and SSE hub assume the same), so the lock is always granted. With Redis it is
 * a `SET NX PX` lease that simply expires. Callers must stay correct without
 * it — the lock only avoids duplicated work.
 */
export async function acquireLock(name: string, ttlMs: number): Promise<boolean> {
  if (!isRedisConfigured() || ttlMs <= 0) return true;
  const result = await getRedis().set(`lock:${name}`, String(process.pid), 'PX', ttlMs, 'NX');
  return result === 'OK';
}
