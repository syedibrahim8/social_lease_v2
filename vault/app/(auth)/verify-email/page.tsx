"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { verifyEmail } from "@/lib/api/endpoints/auth";
import { ApiError } from "@/lib/api/client";

type State =
  | { kind: "verifying" }
  | { kind: "verified" }
  | { kind: "failed"; message: string }
  | { kind: "no-token" };

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = use(searchParams);
  const [state, setState] = useState<State>(() =>
    token ? { kind: "verifying" } : { kind: "no-token" },
  );
  const startedRef = useRef(false);

  useEffect(() => {
    // Verification consumes a single-use token, so this must fire exactly once
    // even though React mounts effects twice in development.
    if (!token || startedRef.current) return;
    startedRef.current = true;

    verifyEmail(token)
      .then(() => setState({ kind: "verified" }))
      .catch((error: unknown) =>
        setState({
          kind: "failed",
          message:
            error instanceof ApiError
              ? error.message
              : "That verification link is no longer valid.",
        }),
      );
  }, [token]);

  if (state.kind === "no-token") {
    return (
      <Panel
        icon={<MailWarning className="size-5" />}
        tone="warning"
        title="This link is incomplete"
        body="The verification link is missing its token. Open the most recent email and use the link there."
      />
    );
  }

  if (state.kind === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (state.kind === "verified") {
    return (
      <Panel
        icon={<BadgeCheck className="size-5" />}
        tone="positive"
        title="Email verified"
        body="Your address is confirmed. You can sign in and get to work."
        action={
          <Button asChild variant="gold" size="sm">
            <Link href="/login">Continue to sign in</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Panel
      icon={<MailWarning className="size-5" />}
      tone="warning"
      title="We couldn't verify that link"
      body={state.message}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Back to sign in</Link>
        </Button>
      }
    />
  );
}

function Panel({
  icon,
  tone,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  tone: "positive" | "warning";
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <span
        className={
          tone === "positive"
            ? "bg-positive/10 text-positive mx-auto grid size-11 place-items-center rounded-xl"
            : "bg-warning/10 text-warning mx-auto grid size-11 place-items-center rounded-xl"
        }
      >
        {icon}
      </span>
      <h1 className="font-display text-bone mt-4 text-2xl">{title}</h1>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
