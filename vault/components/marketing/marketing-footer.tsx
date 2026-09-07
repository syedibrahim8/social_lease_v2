import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function MarketingFooter() {
  return (
    <footer className="border-line-2 border-t">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Logo href="/" />
          <p className="text-muted mt-3 max-w-[38ch] text-[12px] leading-relaxed">
            Escrow backed campaigns between brands and creators. Payments and payouts are processed
            by Stripe.
          </p>
        </div>

        <nav aria-label="Account" className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-muted hover:text-bone text-[13px] transition-colors duration-[var(--duration-fast)]"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-muted hover:text-bone text-[13px] transition-colors duration-[var(--duration-fast)]"
          >
            Get started
          </Link>
        </nav>
      </div>
    </footer>
  );
}
