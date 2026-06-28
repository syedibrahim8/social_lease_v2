"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mockUsers } from "@/lib/api/mock";
import { USE_MOCK } from "@/lib/api/adapter";
import { setAccessTokenGetter, setRefreshHandler } from "@/lib/api/client";
import * as authApi from "@/lib/api/endpoints/auth";
import type { AuthUser, Role } from "@/lib/api/types";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True when running on mock data (role switcher available, no real session). */
  isMock: boolean;
  setRole: (role: Role) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  google: (idToken: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "cam.mock-role";

/** Mock auth: seeded users + a role switcher; always "authenticated". */
function MockAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") return "CREATOR";
    const saved = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    return saved && saved in mockUsers ? saved : "CREATOR";
  });

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: mockUsers[role],
      role,
      isAuthenticated: true,
      isLoading: false,
      isMock: true,
      setRole,
      login: async () => {},
      register: async (input) => setRole(input.role),
      google: async () => {},
      verifyEmail: async () => {},
      resendVerification: async () => {},
      refresh: async () => {},
      logout: async () => {},
    }),
    [role, setRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Live auth: real session against the backend, token kept in memory. */
function LiveAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    setAccessTokenGetter(() => tokenRef.current);
    setRefreshHandler(async () => {
      try {
        const s = await authApi.refreshSession();
        tokenRef.current = s.accessToken;
        setUser(s.user);
        return s.accessToken;
      } catch {
        tokenRef.current = null;
        setUser(null);
        return null;
      }
    });

    let active = true;
    authApi
      .refreshSession()
      .then((s) => {
        if (!active) return;
        tokenRef.current = s.accessToken;
        setUser(s.user);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      setRefreshHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await authApi.login(email, password);
    tokenRef.current = s.accessToken;
    setUser(s.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const s = await authApi.register(input);
    tokenRef.current = s.accessToken;
    setUser(s.user);
  }, []);

  const google = useCallback(async (idToken: string) => {
    const s = await authApi.google(idToken);
    tokenRef.current = s.accessToken;
    setUser(s.user);
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    await authApi.verifyEmail(token);
  }, []);

  const resendVerification = useCallback(async () => {
    await authApi.resendVerification();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await authApi.refreshSession();
      tokenRef.current = s.accessToken;
      setUser(s.user);
    } catch {
      tokenRef.current = null;
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear locally regardless
    }
    tokenRef.current = null;
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      // Placeholder until authenticated; the app route gate blocks render until then.
      user: user ?? mockUsers.CREATOR,
      role: user?.role ?? "CREATOR",
      isAuthenticated: !!user,
      isLoading,
      isMock: false,
      setRole: () => {},
      login,
      register,
      google,
      verifyEmail,
      resendVerification,
      refresh,
      logout,
    }),
    [user, isLoading, login, register, google, verifyEmail, resendVerification, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return USE_MOCK ? (
    <MockAuthProvider>{children}</MockAuthProvider>
  ) : (
    <LiveAuthProvider>{children}</LiveAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
