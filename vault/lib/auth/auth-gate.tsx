"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Wraps the authenticated shell.
 *
 * While the session probe is in flight this renders a skeleton in the SHAPE of
 * the app, not a spinner and not the login page. Flashing a login form at
 * someone who is already signed in is the single most common way a session
 * probe looks broken.
 *
 * The redirect carries `?next=` so a deep link survives the round trip through
 * sign-in — landing back on the dashboard after clicking a link to a specific
 * contract is a small betrayal, and this app is full of deep links from emails
 * and notifications.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) return <ShellSkeleton />;
  if (!isAuthenticated) return <ShellSkeleton />;

  return <>{children}</>;
}

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="border-line-2 hidden w-56 shrink-0 border-r p-4 lg:block">
        <Skeleton className="mb-6 h-7 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="mb-8 h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
