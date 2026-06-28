import { apiFetch } from "../client";
import type { AuthUser, Role } from "../types";

/** Backend PublicUser (login/register) or JWT user (/auth/me — may lack name). */
interface BackendUser {
  id: string;
  email: string;
  name?: string;
  role: Role;
  isVerified: boolean;
  avatar?: string;
}

interface AuthData {
  user: BackendUser;
  accessToken: string;
}

export interface Session {
  user: AuthUser;
  accessToken: string;
}

function mapUser(u: BackendUser): AuthUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email.split("@")[0] ?? u.email,
    role: u.role,
    isVerified: u.isVerified,
    ...(u.avatar ? { avatar: u.avatar } : {}),
  };
}

export async function login(email: string, password: string): Promise<Session> {
  const { data } = await apiFetch<AuthData>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { user: mapUser(data.user), accessToken: data.accessToken };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<Session> {
  const { data } = await apiFetch<AuthData>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { user: mapUser(data.user), accessToken: data.accessToken };
}

export async function google(idToken: string): Promise<Session> {
  const { data } = await apiFetch<AuthData>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  return { user: mapUser(data.user), accessToken: data.accessToken };
}

export async function refreshSession(): Promise<Session> {
  const { data } = await apiFetch<AuthData>("/auth/refresh", { method: "POST" });
  return { user: mapUser(data.user), accessToken: data.accessToken };
}

export async function verifyEmail(token: string): Promise<void> {
  await apiFetch("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(): Promise<void> {
  await apiFetch("/auth/resend-verification", { method: "POST" });
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
