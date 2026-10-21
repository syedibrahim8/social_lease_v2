"use client";

import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Admin screens render only for admins. The API enforces this regardless (403);
 * this just answers plainly instead of showing a screen full of errors.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  if (role !== "ADMIN") {
    return (
      <EmptyState
        icon={ShieldOff}
        title="Admins only"
        description="This part of Social Lease is for the platform team."
      />
    );
  }
  return <>{children}</>;
}
