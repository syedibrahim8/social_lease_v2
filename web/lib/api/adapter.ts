/**
 * Mock ⇄ live seam.
 *
 * - `USE_MOCK` (env `NEXT_PUBLIC_USE_MOCK`, default true): when true the app runs
 *   fully on seeded mock data with the mock auth role-switcher — ideal for design
 *   and demos. When `"false"`, auth + the live-wired endpoints talk to the real
 *   `/api/v1` backend.
 * - `resolve(mock, live)`: the default for endpoints that are NOT yet wired to a
 *   live mapper — always returns the rich mock data, so no screen is ever empty.
 * - `liveFirst(mock, live)`: for endpoints whose live mapper IS done — tries the
 *   real backend and falls back to mock on any error, so live screens degrade to
 *   dummy data instead of breaking.
 */

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/** Simulate realistic network latency for mock responses. */
export function mockDelay(ms = 320): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Un-wired endpoints: always serve mock data (dummy, never empty). */
export async function resolve<T>(
  mock: () => Promise<T>,
  _live: () => Promise<T>,
): Promise<T> {
  void _live;
  return mock();
}

/**
 * Live-wired endpoints: live-first with mock fallback (live mode only). Falls
 * back to mock on error, null/undefined, OR an empty array — so a screen whose
 * backend collection is empty still shows dummy content instead of an empty state.
 */
export async function liveFirst<T>(
  mock: () => Promise<T>,
  live: () => Promise<T>,
): Promise<T> {
  if (USE_MOCK) return mock();
  try {
    const result = await live();
    if (result == null || (Array.isArray(result) && result.length === 0)) {
      return mock();
    }
    return result;
  } catch {
    return mock();
  }
}
