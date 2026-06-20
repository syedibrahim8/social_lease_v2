import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialAuth } from "@/components/auth/social-auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Join the marketplace in under two minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand-text font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SocialAuth label="Sign up with Google" />
      <div className="mt-4">
        <RegisterForm />
      </div>
    </AuthCard>
  );
}
