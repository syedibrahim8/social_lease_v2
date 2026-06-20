import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialAuth } from "@/components/auth/social-auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-text font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <SocialAuth />
      <div className="mt-4">
        <LoginForm />
      </div>
    </AuthCard>
  );
}
