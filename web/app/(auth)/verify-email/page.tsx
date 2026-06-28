"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, MailCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";

type Status = "idle" | "verifying" | "success" | "error";

function VerifyFlow() {
  const params = useSearchParams();
  const token = params.get("token");
  const { user, isAuthenticated, isMock, verifyEmail, resendVerification } =
    useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmail(token)
      .then(() => {
        if (active) setStatus("success");
      })
      .catch((e: unknown) => {
        if (!active) return;
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "Verification failed");
      });
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const onContinue = () => {
    // Full reload so the session re-establishes with the updated verification
    // state (avoids the AuthGate bouncing on a stale in-memory `isVerified`).
    window.location.href = isAuthenticated ? "/dashboard" : "/login";
  };

  const onResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success("Verification email sent", { description: "Check your inbox." });
    } catch (e) {
      toast.error("Could not resend", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setResending(false);
    }
  };

  if (status === "verifying") {
    return (
      <AuthCard title="Verifying your email" subtitle="One moment…">
        <div className="flex justify-center py-4">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title="Email verified" subtitle="Your account is now active.">
        <div className="text-center">
          <div className="bg-success-muted text-success-text mx-auto flex size-11 items-center justify-center rounded-full">
            <BadgeCheck className="size-5" />
          </div>
          <Button variant="brand" size="lg" className="mt-6 w-full" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (status === "error") {
    return (
      <AuthCard
        title="Verification failed"
        subtitle={errorMsg ?? "This link is invalid or has expired."}
      >
        <div className="text-center">
          <div className="bg-danger-muted text-danger-text mx-auto flex size-11 items-center justify-center rounded-full">
            <XCircle className="size-5" />
          </div>
          <div className="mt-6 space-y-2">
            {isAuthenticated && !isMock ? (
              <Button variant="brand" size="lg" className="w-full" loading={resending} onClick={onResend}>
                Resend verification email
              </Button>
            ) : null}
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  // idle — landed here right after signing up (no token yet)
  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        isAuthenticated
          ? `We sent a verification link to ${user.email}.`
          : "We sent you a verification link."
      }
    >
      <div className="text-center">
        <div className="bg-brand-muted text-brand-text mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          Click the link in the email to activate your account. Check your spam
          folder if you don&apos;t see it within a minute.
        </p>
        <div className="mt-6 space-y-2">
          {isMock ? (
            <Button asChild variant="brand" size="lg" className="w-full">
              <Link href="/dashboard">Continue to dashboard</Link>
            </Button>
          ) : null}
          {isAuthenticated && !isMock ? (
            <Button variant="brand" size="lg" className="w-full" loading={resending} onClick={onResend}>
              Resend email
            </Button>
          ) : null}
          <Button variant="ghost" size="lg" className="w-full" onClick={onContinue}>
            I&apos;ve already verified
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyFlow />
    </Suspense>
  );
}
