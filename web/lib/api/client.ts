import type { ApiErrorShape, ApiFieldError, ApiMeta } from "./types";

/**
 * Typed fetch wrapper over the backend's response envelopes. The access token is
 * injected per-request from the AuthProvider via `getAccessToken`; the refresh
 * cookie rides along because of `credentials: "include"`. On a 401 it asks the
 * registered refresh handler for a new token and retries the request once.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/** Error carrying the backend's normalized field errors + HTTP status. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(message: string, status: number, errors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

let accessTokenGetter: () => string | null = () => null;
let refreshHandler: (() => Promise<string | null>) | null = null;

/** Wire the in-memory access token source (set by the AuthProvider). */
export function setAccessTokenGetter(getter: () => string | null): void {
  accessTokenGetter = getter;
}

/** Wire the 401 → refresh handler (returns a new access token or null). */
export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<ApiResult<T>> {
  const token = accessTokenGetter();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !retried && refreshHandler && !path.startsWith("/auth/")) {
    const next = await refreshHandler();
    if (next) return apiFetch<T>(path, init, true);
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // empty/non-JSON body
  }

  if (!res.ok || (json as ApiErrorShape | null)?.success === false) {
    const err = json as ApiErrorShape | null;
    throw new ApiError(
      err?.message ?? `Request failed (${res.status})`,
      res.status,
      err?.errors ?? [],
    );
  }

  const ok = json as { data: T; meta?: ApiMeta };
  return { data: ok.data, meta: ok.meta };
}
