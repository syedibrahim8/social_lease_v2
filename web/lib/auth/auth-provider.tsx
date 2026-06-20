"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockUsers } from "@/lib/api/mock";
import type { AuthUser, Role } from "@/lib/api/types";

/**
 * Mock authentication for the build phase. Exposes the current user plus a
 * ROLE SWITCHER so every persona's screens are reachable without a backend.
 * The live phase (L11) replaces the internals with a real session + in-memory
 * access token; the `useAuth` contract stays the same so callers don't change.
 */

interface AuthContextValue {
  user: AuthUser;
  role: Role;
  setRole: (role: Role) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "cam.mock-role";

function readInitialRole(): Role {
  if (typeof window === "undefined") return "CREATOR";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Role | null;
  return saved && saved in mockUsers ? saved : "CREATOR";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readInitialRole);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: mockUsers[role], role, setRole, isAuthenticated: true }),
    [role, setRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
