"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Amount } from "@/components/money/amount";
import { EscrowTracker } from "@/components/money/escrow-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * The grid drifts a little slower than the page. That is the only reason it
 * moves: parallax is what tells the eye the texture is behind the content
 * rather than printed on it. It is masked to a soft ellipse so it never reads
 * as ruled lines drawn to make the page look designed.
 */
function HeroBackdrop() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 90]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        style={{
          y,
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--color-gold) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-gold) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 75% 62% at 50% 8%, black, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 62% at 50% 8%, black, transparent 78%)",
        }}
        className="absolute inset-x-0 -top-24 h-[140%]"
      />
      {/* The one saturated element above the fold. */}
      <div className="absolute top-[-18%] left-1/2 h-[520px] w-[820px] max-w-[130vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-emerald-deep)_85%,transparent),transparent)] blur-[6px]" />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-24 pb-16 lg:pb-24">
      <HeroBackdrop />

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:px-8">
        <div>
          <Badge tone="gold">
            <Lock aria-hidden="true" />
            Escrow held at Stripe
          </Badge>

          {/* The measure is capped so the line breaks after "is" and the italic
              phrase stays whole. leading-[1.08] plus the padding below reserves
              room for the descender in "already", which leading-none clips. */}
          <h1 className="font-display text-bone mt-5 max-w-[12ch] pb-1 text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            The money is <em className="text-gold-lo italic">already there</em>.
          </h1>

          <p className="text-bone-2 mt-5 max-w-[46ch] text-base leading-relaxed sm:text-lg">
            Brands fund escrow before the work starts. Creators deliver, brands approve, and the
            payout clears.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Not a mock-up of a product screen: this is the contract tracker the
            app itself renders, given a status. The marketing claim and the
            product are the same component. */}
        <div className="lg:justify-self-end lg:pl-4">
          <Card tone="money" className="w-full max-w-[420px] p-6 shadow-[var(--shadow-lift)]">
            <p className="text-bone-2 text-xs">Held in escrow</p>
            <p className="mt-1.5">
              <Amount minor={400000} variant="display" className="text-4xl sm:text-[2.75rem]" />
            </p>
            <div className="border-line my-5 border-t" />
            <EscrowTracker status="FUNDED" />
          </Card>
          <p className="text-muted mt-3 text-[11px]">Example contract.</p>
        </div>
      </div>
    </section>
  );
}
