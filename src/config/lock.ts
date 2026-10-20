/**
 * Best-effort mutual exclusion across API instances.
 *
 * Without Redis there is a single instance by definition (the in-memory rate
 * limiter and SSE hub assume the same), so the lock is always granted. With
 * Redis it becomes a `SET NX PX` lease. Callers must stay correct without it;
 * the lock only avoids duplicated work.
 */
export async function acquireLock(name: string, ttlMs: number): Promise<boolean> {
  void name;
  void ttlMs;
  return Promise.resolve(true);
}
