"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { Amount } from "@/components/money/amount";
import { EscrowTracker } from "@/components/money/escrow-tracker";
import { Card } from "@/components/ui/card";
import type { ContractStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * The section that earns the page.
 *
 * The visual is <EscrowTracker>, the same component the contract screen
 * renders, driven by real ContractStatus values. Scrolling advances the status,
 * so the claim being made and the product making it are literally the same
 * code. Nothing here is a picture of a product.
 *
 * MOTIVATED MOTION: the animation is the explanation. Escrow is a sequence, and
 * a sequence is the one thing a static diagram explains badly. Everything else
 * on this page stays still.
 *
 * REDUCED MOTION: nothing here moves. The tracker changes state with scroll
 * position, which is content, not travel, and every panel is fully legible at
 * every step rather than being dimmed until its turn. The tracker's pulse on
 * the current step is a CSS animation, so the global reduced-motion rule stops
 * it without this component knowing.
 */
const STOPS: {
  status: ContractStatus;
  title: string;
  body: string;
}[] = [
  {
    status: "PENDING_FUNDING",
    title: "The brand funds it first",
    body: "Stripe Checkout takes the payment at the start of the contract instead of the end. The platform holds it, and the creator can see that it is there.",
  },
  {
    status: "FUNDED",
    title: "The creator delivers",
    body: "Screenshots, analytics and links attach to the contract itself. There is no invoice to raise and nothing to email to an accounts inbox.",
  },
  {
    status: "SUBMITTED",
    title: "The brand reviews once",
    body: "Approve it, or send it back with notes and let it come round again. The money stays exactly where it is either way.",
  },
  {
    status: "APPROVED",
    title: "The payout clears",
    body: "Approval is what releases the transfer to the creator's connected Stripe account, minus the platform fee. Same day, not thirty.",
  },
];

/** The fifth state: everything done, money gone to the creator. */
const FINAL: ContractStatus = "COMPLETED";

const CONTRACT_MINOR = 400_000;
const PAYOUT_MINOR = 360_000;

export function EscrowWalkthrough() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  // "start center" to "end center" makes progress map linearly onto which
  // panel is crossing the middle of the screen: panel i owns the range
  // [i/4, (i+1)/4]. Anything else puts the tracker a step ahead of the words
  // the reader is looking at, which is worse than not animating at all.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });

  // Five discrete stops, not a continuous value: state is the right tool here,
  // and it re-renders at most four times across the whole section.
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const panel = Math.min(STOPS.length - 1, Math.max(0, Math.floor(value * STOPS.length)));
    // The last stretch of the last panel is where the transfer lands.
    const next = value > 0.88 ? STOPS.length : panel;
    setStep((current) => (current === next ? current : next));
  });

  const released = step >= STOPS.length;
  const status = released ? FINAL : (STOPS[step]?.status ?? "PENDING_FUNDING");

  return (
    <section id="how" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <header className="max-w-[52ch]">
          <h2 className="font-display text-bone text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Follow the money.
          </h2>
          <p className="text-bone-2 mt-4 text-[15px] leading-relaxed">
            This is the tracker the contract screen shows, not a drawing of one. Keep scrolling and
            it moves through the states a real contract moves through.
          </p>
        </header>

        <div ref={ref} className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          {/* Parked in the upper third rather than hard against the nav, so the
              left column does not read as a card with a field of nothing under
              it while the panels go by. */}
          <div className="sticky top-20 z-10 self-start lg:top-[22vh]">
            <Card tone="money" className="p-6 shadow-[var(--shadow-lift)]">
              <p className="text-bone-2 text-xs">
                {released ? "Released to the creator" : step === 0 ? "To be funded" : "Held in escrow"}
              </p>
              <p className="mt-1.5">
                <Amount
                  minor={released ? PAYOUT_MINOR : CONTRACT_MINOR}
                  variant="display"
                  className="text-4xl sm:text-[2.75rem]"
                />
              </p>
              {released ? (
                <p className="text-muted mt-1 text-[11px]">
                  <Amount minor={CONTRACT_MINOR} /> contract, less the 10% platform fee.
                </p>
              ) : null}
              <div className="border-line my-5 border-t" />
              <EscrowTracker status={status} />
            </Card>
          </div>

          <ol className="space-y-4 lg:space-y-0">
            {STOPS.map((stop, i) => {
              const active = Math.min(step, STOPS.length - 1) === i;
              return (
                <li
                  key={stop.title}
                  className={cn(
                    "border-l py-6 pl-5 lg:min-h-[42vh] lg:py-14",
                    "transition-colors duration-[var(--duration-base)]",
                    active ? "border-gold" : "border-line-2",
                  )}
                >
                  <h3
                    className={cn(
                      "font-display text-2xl leading-tight tracking-tight transition-colors duration-[var(--duration-base)] sm:text-3xl",
                      active ? "text-bone" : "text-bone-2",
                    )}
                  >
                    {stop.title}
                  </h3>
                  <p className="text-muted mt-3 max-w-[46ch] text-[14px] leading-relaxed">
                    {stop.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
