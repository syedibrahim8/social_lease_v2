"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Guards the (app) routes (live mode): redirects to /login when not signed in,
 * and to /verify-email when a manual signup hasn't verified their email yet.
 * Mock mode and Google-verified accounts pass straight through.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isMock, user } = useAuth();
  const router = useRouter();

  const needsVerification = isAuthenticated && !isMock && !user.isVerified;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace("/login");
    else if (needsVerification) router.replace("/verify-email");
  }, [isLoading, isAuthenticated, needsVerification, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || needsVerification) return null;

  return <>{children}</>;
}
