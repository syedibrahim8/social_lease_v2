"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { startConnectOnboarding } from "@/lib/api/endpoints/payments";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Stripe's `refresh_url`.
 *
 * Account Links are single-use and expire quickly. When someone opens a stale
 * one — or abandons onboarding and comes back — Stripe sends them here rather
 * than to an error. The only correct response is to mint a fresh link and send
 * them straight back, so that is done automatically; the button is for when the
 * automatic attempt fails.
 */
export default function OnboardRefreshPage() {
  const { role, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Only a creator can hold a payout account, and the backend enforces it.
    if (isLoading || role !== "CREATOR" || startedRef.current) return;
    startedRef.current = true;

    startConnectOnboarding()
      .then(({ onboardingUrl }) => {
        window.location.href = onboardingUrl;
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : "Could not start onboarding again."),
      );
  }, [isLoading, role]);

  if (!isLoading && role !== "CREATOR") {
    return (
      <Shell
        title="Payout setup is for creators"
        body="Only a creator account can connect a payout destination. Sign in as the creator who needs to be paid, then start again from the wallet."
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }

  if (error) {
    return (
      <Shell
        title="That link had expired"
        body={error}
        action={
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              startedRef.current = false;
              setError(null);
              startConnectOnboarding()
                .then(({ onboardingUrl }) => {
                  window.location.href = onboardingUrl;
                })
                .catch((e: unknown) =>
                  setError(e instanceof ApiError ? e.message : "Still could not start."),
                );
            }}
          >
            <RefreshCw />
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <Shell
      title="Taking you back to Stripe"
      body="That setup link had expired, which is normal. We're generating a fresh one now."
    />
  );
}

function Shell({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span className="bg-gold/10 text-gold-lo mx-auto grid size-12 place-items-center rounded-2xl">
        <RefreshCw className="size-5" aria-hidden="true" />
      </span>
      <h1 className="font-display text-bone mt-4 text-2xl">{title}</h1>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
