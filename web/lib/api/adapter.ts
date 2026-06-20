/**
 * The mock ⇄ live seam. Every endpoint module routes through `resolve()`:
 * while `USE_MOCK` is true it returns seeded data (so the whole UI is buildable
 * with no backend); flipping `NEXT_PUBLIC_USE_MOCK=false` makes the same call
 * hit the real `/api/v1` via `client.apiFetch`. This is the single switch the
 * L11 live-integration layer throws.
 */

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/** Simulate realistic network latency for mock responses. */
export function mockDelay(ms = 320): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pick the mock or live implementation for an endpoint. */
export async function resolve<T>(
  mock: () => Promise<T>,
  live: () => Promise<T>,
): Promise<T> {
  return USE_MOCK ? mock() : live();
}
