import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="border-border flex h-14 items-center justify-between border-b px-6">
        <Logo />
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Sign out
        </Link>
      </header>
      <main className="mx-auto max-w-xl px-6 py-10">{children}</main>
    </div>
  );
}
