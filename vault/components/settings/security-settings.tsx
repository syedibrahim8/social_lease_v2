"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api/client";
import { forgotPassword, resendVerification } from "@/lib/api/endpoints/auth";
import { useAuth } from "@/lib/auth/auth-provider";

/**
 * Password changes go through the emailed reset flow rather than an in-place
 * form, because that is the only path the backend exposes — and it is the safer
 * one: it proves control of the mailbox before the password moves.
 *
 * Completing a reset also nulls the stored refresh token, which signs every
 * session out. That is said up front rather than discovered.
 */
export function SecuritySettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sendingReset, setSendingReset] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  if (!user) return null;

  const sendReset = async () => {
    setSendingReset(true);
    try {
      await forgotPassword(user.email);
      toast.success(`Reset link sent to ${user.email}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send the reset link.");
    } finally {
      setSendingReset(false);
    }
  };

  const sendVerification = async () => {
    setSendingVerify(true);
    try {
      await resendVerification();
      toast.success("Verification email sent.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not send that email.");
    } finally {
      setSendingVerify(false);
    }
  };

  const signOut = async () => {
    await logout();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-3">
          <p className="text-bone text-[13px] font-medium">Account</p>
          <div className="border-line-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-bone-2 truncate text-[13px]">{user.email}</p>
              <p className="text-muted mt-0.5 text-[11px]">
                Signed in as {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
              </p>
            </div>
            {user.isVerified ? (
              <Badge tone="positive">
                <MailCheck aria-hidden="true" />
                Verified
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge tone="warning">Unverified</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={sendingVerify}
                  onClick={() => void sendVerification()}
                >
                  Resend
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-bone flex items-center gap-2 text-[13px] font-medium">
              <KeyRound className="size-3.5" aria-hidden="true" />
              Password
            </p>
            <p className="text-muted mt-1 max-w-[54ch] text-xs leading-relaxed">
              We email you a link rather than changing it here, so nobody with your open laptop
              can change it without your inbox. Completing the reset signs out every session,
              including this one.
            </p>
          </div>
          <Button variant="ghost" loading={sendingReset} onClick={() => void sendReset()}>
            Email me a reset link
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-bone flex items-center gap-2 text-[13px] font-medium">
              <ShieldAlert className="size-3.5" aria-hidden="true" />
              Sign out
            </p>
            <p className="text-muted mt-1 max-w-[54ch] text-xs leading-relaxed">
              Ends this session and clears everything cached in this browser.
            </p>
          </div>
          <Button variant="danger" onClick={() => void signOut()}>
            Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
