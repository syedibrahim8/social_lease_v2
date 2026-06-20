import type { ApiErrorShape, ApiFieldError, ApiMeta } from "./types";

/**
 * Typed fetch wrapper over the backend's response envelopes. Used on the LIVE
 * path (the mock adapter short-circuits before this in earlier layers). The
 * access token is injected per-request via `getAccessToken`; the refresh
 * cookie is sent automatically because of `credentials: "include"`.
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

/** Wire the in-memory access token source (set by the AuthProvider, live phase). */
export function setAccessTokenGetter(getter: () => string | null): void {
  accessTokenGetter = getter;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
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
