"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Questions", href: "#questions" },
];

/**
 * One line at every width, 64px tall. The section links are the first thing to
 * go on a narrow screen: they are shortcuts to content the visitor reaches by
 * scrolling anyway, whereas the sign-in pair is the reason the bar exists.
 *
 * The bar is transparent over the hero and gains its ground once the page has
 * moved, so the hero reads as full bleed without the nav ever sitting on top of
 * text it cannot be read against.
 */
export function MarketingNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40",
        "transition-[background-color,border-color,backdrop-filter] duration-[var(--duration-base)]",
        scrolled
          ? "border-line-2 bg-ink/80 border-b backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo href="/" />

        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted hover:text-bone text-[13px] transition-colors duration-[var(--duration-fast)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && !isLoading ? (
            <Button asChild variant="gold" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="quiet" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
