import type { ApiFieldError, ApiMeta, ErrorBody, SuccessBody } from "@/lib/api/types";

/**
 * The single seam between this app and the backend.
 *
 * Nothing else in `vault/` calls `fetch`. That matters for one reason above all:
 * there is exactly one place where a failed request can be turned into
 * something other than an error, and this file never does that. No fallback, no
 * fixtures, no swallowing. A screen either gets its data or gets to show the
 * server's own message.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

/**
 * Carries the backend's normalised field errors alongside the HTTP status, so a
 * form can drop a 422 onto the exact input that caused it instead of showing a
 * generic toast.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: ApiFieldError[];

  constructor(message: string, status: number, errors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** The first message attached to a given field, if the server sent one. */
  fieldError(field: string): string | undefined {
    return this.errors.find((e) => e.field === field)?.message;
  }
}

/* ── Token plumbing ───────────────────────────────────────────────────────────
   The access token lives in memory inside the auth provider — never in
   localStorage, where any injected script could read it. The provider registers
   a getter here rather than this module importing React state, which keeps this
   file framework-agnostic and testable.                                       */

let getAccessToken: () => string | null = () => null;
let refreshSession: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(getter: () => string | null): void {
  getAccessToken = getter;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshSession = handler;
}

/**
 * The current access token, rotating it first if there isn't one.
 *
 * For the SSE stream, which authenticates once at handshake rather than
 * per-request and so cannot lean on the 401-retry path below.
 */
export async function getTokenForStream(): Promise<string | null> {
  const existing = getAccessToken();
  if (existing) return existing;
  return refreshSession ? refreshOnce() : null;
}

export interface ApiResult<T> {
  data: T;
  meta?: ApiMeta;
}

/** Requests already in flight share one refresh, so a burst of 401s is one call. */
let inFlightRefresh: Promise<string | null> | null = null;

async function refreshOnce(): Promise<string | null> {
  inFlightRefresh ??= refreshSession?.().finally(() => {
    inFlightRefresh = null;
  }) ?? Promise.resolve(null);
  return inFlightRefresh;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<ApiResult<T>> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    // The refresh token is an httpOnly cookie scoped to /api/v1/auth. :3001 and
    // :8080 are cross-origin but SAME-SITE, so the dev cookie's sameSite:'lax'
    // still sends it — no backend cookie change was needed for this app.
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  // A 401 on a normal call means the ~15m access token expired. Rotate it once
  // and replay. Never on /auth/* itself: a failed login is a real answer, and
  // retrying it would turn "wrong password" into an infinite loop.
  if (response.status === 401 && !retried && refreshSession && !path.startsWith("/auth/")) {
    const next = await refreshOnce();
    if (next) return apiFetch<T>(path, init, true);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // 204s and non-JSON error pages both land here; handled below.
  }

  const failed = !response.ok || (body as ErrorBody | null)?.success === false;
  if (failed) {
    const err = body as ErrorBody | null;
    throw new ApiError(
      err?.message ?? `Request failed (${response.status})`,
      response.status,
      err?.errors ?? [],
    );
  }

  const ok = body as SuccessBody<T> | null;
  // Unwrap the envelope so callers work with the payload, not the wrapper.
  return ok?.meta !== undefined
    ? { data: ok.data, meta: ok.meta }
    : { data: (ok?.data ?? null) as T };
}

/** Convenience for the common case of a call with no pagination meta. */
export async function apiGet<T>(path: string): Promise<T> {
  return (await apiFetch<T>(path)).data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (
    await apiFetch<T>(path, {
      method: "POST",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  ).data;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return (await apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) })).data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  return (await apiFetch<T>(path, { method: "DELETE" })).data;
}

/** Build a query string, dropping empty values so filters stay out of the URL. */
export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "" && v !== false,
  );
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()}`;
}
