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
import { setAccessTokenGetter, setRefreshHandler } from "@/lib/api/client";
import * as authApi from "@/lib/api/endpoints/auth";
import type { RegisterInput } from "@/lib/api/endpoints/auth";
import type { AuthUser, Role, Session } from "@/lib/api/types";

/**
 * The one session in this app. There is no mock provider and no role switcher —
 * you are whoever the backend says you are, which is the point.
 *
 * The access token lives in a ref, never in state and never in localStorage:
 *   - not localStorage, because any injected script can read it there;
 *   - not state, because every rotation would re-render the whole tree.
 * The client reads it through a registered getter, so this is the only module
 * that ever holds it.
 */
interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** True only during the initial session probe on mount. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  google: (idToken: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Replace the cached user after a profile edit, without a round trip. */
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const adopt = useCallback((session: Session): AuthUser => {
    tokenRef.current = session.accessToken;
    setUserState(session.user);
    return session.user;
  }, []);

  const clear = useCallback(() => {
    tokenRef.current = null;
    setUserState(null);
  }, []);

  useEffect(() => {
    setAccessTokenGetter(() => tokenRef.current);

    // The client calls this on a 401. Returning null means "genuinely logged
    // out" and the failed request is allowed to surface as a 401 rather than
    // being retried forever.
    setRefreshHandler(async () => {
      try {
        const session = await authApi.refreshSession();
        tokenRef.current = session.accessToken;
        setUserState(session.user);
        return session.accessToken;
      } catch {
        tokenRef.current = null;
        setUserState(null);
        return null;
      }
    });

    let active = true;

    // Probe for an existing session on mount. A rejection here is the normal
    // logged-out case, not an error worth surfacing.
    void authApi
      .refreshSession()
      .then((session) => {
        if (!active) return;
        tokenRef.current = session.accessToken;
        setUserState(session.user);
      })
      .catch(() => {
        if (active) tokenRef.current = null;
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      setRefreshHandler(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      login: async (email, password) => adopt(await authApi.login(email, password)),
      register: async (input) => adopt(await authApi.register(input)),
      google: async (idToken) => adopt(await authApi.google(idToken)),
      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          // Clear locally even if the call failed — the user asked to leave,
          // and a stale token in memory helps nobody.
          clear();
        }
      },
      refresh: async () => {
        try {
          adopt(await authApi.refreshSession());
        } catch {
          clear();
        }
      },
      setUser: setUserState,
    }),
    [user, isLoading, adopt, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
