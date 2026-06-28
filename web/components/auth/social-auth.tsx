"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  type CredentialResponse,
} from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"
      />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-border h-px flex-1" />
      <span className="text-muted-foreground text-xs">or</span>
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

/** Real Google Sign-In when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set; styled fallback otherwise. */
export function SocialAuth({ label = "Continue with Google" }: { label?: string }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { google } = useAuth();

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() =>
            toast.message("Google sign-in", {
              description: "Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable it.",
            })
          }
        >
          <GoogleIcon />
          {label}
        </Button>
        <Divider />
      </div>
    );
  }

  const onSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) {
      toast.error("Google sign-in failed", { description: "No credential returned." });
      return;
    }
    try {
      await google(cred.credential);
      router.push("/dashboard");
    } catch (e) {
      toast.error("Google sign-in failed", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={() => toast.error("Google sign-in failed")}
            theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
            size="large"
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>
      </GoogleOAuthProvider>
      <Divider />
    </div>
  );
}
