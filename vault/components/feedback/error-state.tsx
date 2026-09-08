"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shows the server's own message where there is one. The backend returns a
 * human-readable `message` in its error envelope, and it is almost always more
 * useful than anything invented here ("Contract is APPROVED and cannot be
 * funded" beats "Something went wrong").
 */
export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message =
    error instanceof Error && error.message ? error.message : "Something went wrong.";

  return (
    <div
      className={cn(
        "border-negative/25 bg-negative/[0.04] flex flex-col items-center rounded-xl border px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-negative/10 text-negative mb-4 grid size-11 place-items-center rounded-xl">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <p className="font-display text-bone text-base">That didn&apos;t load</p>
      <p className="text-muted mt-1.5 max-w-[46ch] text-xs leading-relaxed">{message}</p>
      {onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry} className="mt-5">
          <RotateCw />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
