"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthCard
      title="Verify your email"
      subtitle="We sent a verification link to your inbox."
    >
      <div className="text-center">
        <div className="bg-brand-muted text-brand-text mx-auto flex size-11 items-center justify-center rounded-full">
          <MailCheck className="size-5" />
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          Click the link in the email to activate your account. It can take a
          minute to arrive — check your spam folder if you don&apos;t see it.
        </p>
        <div className="mt-6 space-y-2">
          <Button asChild variant="brand" size="lg" className="w-full">
            <Link href="/dashboard">Continue to dashboard</Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => toast.success("Verification email resent")}
          >
            Resend email
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
