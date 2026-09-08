import { apiGet, apiPost } from "@/lib/api/client";
import type { AuthUser, Role, Session } from "@/lib/api/types";

/** ADMIN is never self-assignable at registration — the backend rejects it. */
export type SelfAssignableRole = Extract<Role, "CREATOR" | "BRAND">;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: SelfAssignableRole;
}

export function login(email: string, password: string): Promise<Session> {
  return apiPost<Session>("/auth/login", { email, password });
}

export function register(input: RegisterInput): Promise<Session> {
  return apiPost<Session>("/auth/register", input);
}

export function google(idToken: string): Promise<Session> {
  return apiPost<Session>("/auth/google", { idToken });
}

/**
 * Rotates the refresh cookie and returns a fresh access token. Sends no
 * Authorization header — the httpOnly cookie is the entire credential.
 */
export function refreshSession(): Promise<Session> {
  return apiPost<Session>("/auth/refresh");
}

export function logout(): Promise<null> {
  return apiPost<null>("/auth/logout");
}

export function me(): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/me");
}

export function verifyEmail(token: string): Promise<null> {
  return apiPost<null>("/auth/verify-email", { token });
}

export function resendVerification(): Promise<null> {
  return apiPost<null>("/auth/resend-verification");
}

export function forgotPassword(email: string): Promise<null> {
  return apiPost<null>("/auth/forgot-password", { email });
}

export function resetPassword(token: string, password: string): Promise<null> {
  return apiPost<null>("/auth/reset-password", { token, password });
}
