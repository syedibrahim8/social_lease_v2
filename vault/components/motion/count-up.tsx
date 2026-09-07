"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { Amount } from "@/components/money/amount";
import { durations, easings } from "@/lib/motion";

/**
 * Counts a money value up from zero, once, on mount.
 *
 * WHERE THIS BELONGS: marketing surfaces and one-off confirmations — the
 * landing page's stat strip, a payout receipt. NOT a wallet balance. A figure
 * someone checks daily should not make them wait to read it, and one that
 * re-animated on every background refetch would be moving several times a
 * minute. Use plain <Amount> in the app; use this where the number is the
 * story.
 *
 * HYDRATION: the server cannot know `prefers-reduced-motion`, so initial state
 * must not branch on it — both sides start at zero and the effect resolves what
 * happens next. Under reduced motion that resolution is immediate rather than
 * animated, which is why the zero-duration animate() below is not a hack: it
 * routes the "no motion" case through the same code path instead of setting
 * state synchronously in the effect body.
 */
export function CountUp({
  minor,
  currency = "USD",
  variant = "display",
  className,
}: {
  minor: number;
  currency?: string;
  variant?: "display" | "figure";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controls = animate(reduced ? minor : 0, minor, {
      duration: reduced ? 0 : durations.money,
      ease: easings.out,
      // Minor units are integers all the way down; a fractional cent must never
      // reach the formatter.
      onUpdate: (v) => setDisplay(Math.round(v)),
    });

    return () => controls.stop();
  }, [minor, reduced]);

  return (
    <Amount minor={display} currency={currency} variant={variant} className={className} />
  );
}
